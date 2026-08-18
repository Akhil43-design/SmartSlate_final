# Movie Ticket Booking System — Full Walkthrough & Build Guide

Reference repo: `github.com/Subhashchandra-Birajdar/movie-ticket-booking-system-SpringBoot`

## Contents
1. [What this project is](#1-what-this-project-is)
2. [Tech stack — reading pom.xml](#2-tech-stack--reading-pomxml)
3. [Project structure](#3-project-structure)
4. [The data model — entities & enums](#4-the-data-model--entities--enums)
5. [Repository layer](#5-repository-layer)
6. [Request/response DTOs & converters](#6-requestresponse-dtos--converters)
7. [Service layer — the business logic](#7-service-layer--the-business-logic)
8. [Controller layer — the REST API](#8-controller-layer--the-rest-api)
9. [Exception handling](#9-exception-handling)
10. [Security — JWT authentication](#10-security--jwt-authentication)
11. [Tracing one request end-to-end](#11-tracing-one-request-end-to-end-post-ticketbook)
12. [What to imitate, what to fix](#12-what-to-imitate-what-to-fix)
13. [Step-by-step: build your own project](#13-step-by-step-build-your-own-project)

---

## 1. What this project is

A BookMyShow-style backend: admins add movies, theaters, and shows; users sign up and book seats. It's a pure REST API — JSON in, JSON out, no HTML pages — which is ideal for learning, since you can see the entire backend without any frontend complexity in the way.

Domain flow: a `Theater` has a permanent seat map (`TheaterSeat`). When a `Show` is scheduled and its seats are "associated," each `TheaterSeat` gets copied into a `ShowSeat` — a per-show snapshot with its own price and availability. A `User` books a `Ticket` against specific `ShowSeat`s for one `Show`.

## 2. Tech stack — reading pom.xml

| Dependency | What it gives you |
|---|---|
| `spring-boot-starter-data-jpa` | JPA/Hibernate — talk to the DB via Java objects instead of raw SQL |
| `spring-boot-starter-web` | Embedded Tomcat + `@RestController`, `@RequestMapping` — turns your classes into a REST API |
| `postgresql` (runtime scope) | JDBC driver for Postgres — only needed when *running*, not compiling |
| `spring-boot-starter-security` | Authentication/authorization framework |
| `jjwt-api` / `jjwt-impl` / `jjwt-jackson` | Create and parse JWTs (JSON Web Tokens) for stateless auth |
| `springdoc-openapi-starter-webmvc-ui` | Auto-generates Swagger UI at `/swagger-ui.html` from your annotated controllers |
| `lombok` (optional) | Code-gen annotations (`@Data`, `@Builder`...) that write getters/setters/constructors for you at compile time |

Java 17, single Maven module. `application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/movie_ticket_booking?createTableIfNotExists=true
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```
`ddl-auto=update` means Hibernate looks at your `@Entity` classes on startup and creates/alters tables to match them. Great for learning — you never hand-write `CREATE TABLE`. Risky for production, since it can make silent, occasionally destructive schema changes; real projects switch to migration tools like Flyway or Liquibase once the schema stabilizes.

## 3. Project structure

```
com.sb.movie/
├── MovieTicketBookingSystemApplication.java   ← entry point
├── entities/      ← @Entity classes = database tables
├── enums/         ← fixed value sets (Genre, Gender, SeatType...)
├── repositories/  ← JpaRepository interfaces = data access
├── request/       ← DTOs for incoming JSON
├── response/      ← DTOs for outgoing JSON
├── converter/     ← manual mapping between DTOs and entities
├── services/      ← interface + Impl pairs = business logic
├── controllers/   ← @RestController classes = REST endpoints
├── exceptions/    ← custom RuntimeException subclasses
└── security/      ← JWT filter, config, user details
```

This is a **layered / N-tier** architecture — the most common style at this size. Package-by-layer (all controllers together, all services together) is what you're looking at; larger codebases often switch to package-by-feature (a `movie/` package containing its own controller+service+repo). Same ideas, different folders.

`@SpringBootApplication` on the main class expands to `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`. Component scanning starts at this package and walks downward, so every `@Service`/`@Repository`/`@RestController`/`@Component` under `com.sb.movie` is auto-registered as a Spring bean — no XML, no manual wiring.

## 4. The data model — entities & enums

**Annotation cheat sheet**, used across every entity below:
- `@Entity` / `@Table(name=...)` — this class is a table
- `@Id` / `@GeneratedValue(strategy = GenerationType.IDENTITY)` — primary key, auto-incremented by the DB
- `@Column(nullable=false / unique=true)` — column constraints
- `@Enumerated(EnumType.STRING)` — store the enum's *name* as text (`"ACTION"`), not its ordinal number. Always prefer `STRING` — `ORDINAL` silently breaks if you ever reorder the enum's values.
- `@OneToMany(mappedBy=..., cascade=CascadeType.ALL)` — "the other entity holds the foreign key; saving/deleting me cascades to my children"
- `@ManyToOne` / `@JoinColumn` — "I hold the foreign key column"
- Lombok `@Data` `@Builder` `@NoArgsConstructor` `@AllArgsConstructor` — getters/setters/builder/constructors generated for you. JPA specifically requires that no-arg constructor to exist.

**Movie** — one movie has many shows:
```java
@Entity @Table(name = "MOVIES")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Movie {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(nullable = false) private String movieName;
    private Integer duration;
    @Column(scale = 2) private Double rating;
    private Date releaseDate;
    @Enumerated(EnumType.STRING) private Genre genre;
    @Enumerated(EnumType.STRING) private Language language;
    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL)
    private List<Show> shows = new ArrayList<>();
}
```
(`cascade = ALL` also cascades *deletes* — fine here, but think twice before using it on an entity with history you want to keep, like tickets.)

**Theater / TheaterSeat** — a theater has many seats (its permanent map) and many shows. `TheaterSeat` just holds a `seatNo` + `SeatType` tied to one theater.

**Show / ShowSeat** — `Show` is the join point: `@ManyToOne` to both `Movie` and `Theater`, plus its own lists of `ShowSeat`s and `Ticket`s. `ShowSeat` is the seat map *for this one show* — generated from the theater's seats with its own `isAvailable` flag and price. This two-table seat design (`TheaterSeat` = template, `ShowSeat` = per-show snapshot) is the key idea worth internalizing: it's how seat "1A" can be sold out for the 6 PM show and open for the 9 PM show without ever touching the template.

**Ticket** — belongs to one `Show` and one `User`. Stores `bookedSeats` as a single comma-joined string (`"1A,1B,2A,"`) rather than a proper join table. Works, but it's a shortcut — a cleaner design would be a `Ticket ↔ ShowSeat` join table so you can query "which seats does this ticket cover" without string-splitting.

**User** — `roles` is a plain comma-separated `String` (e.g. `"ROLE_USER"`), not a proper roles table. Same kind of shortcut — fine for one role per user, awkward the moment someone needs multiple roles cleanly modeled.

**Enums** — `Gender`, `Genre`, `Language`, `SeatType`: plain Java enums, no annotations on the enum itself. The `@Enumerated` on the *entity field* is what tells JPA how to persist it.

## 5. Repository layer

`JpaRepository<Entity, IdType>` gives you `save()`, `findById()`, `findAll()`, `deleteById()`, and more — zero implementation code needed.

**Derived queries** — Spring Data parses the method name itself:
```java
public interface MovieRepository extends JpaRepository<Movie, Integer> {
    Movie findByMovieName(String name);   // "findBy" + "MovieName" → generates the SQL automatically
}
```

**Custom `@Query`** for anything a method name can't express:
```java
@Query(value = "select time from shows where date = :date and movie_id = :movieId and theater_id = :theaterId",
       nativeQuery = true)
List<Time> getShowTimingsOnDate(@Param("date") Date date, @Param("theaterId") Integer theaterId, @Param("movieId") Integer movieId);
```
`nativeQuery = true` means raw SQL against actual table/column names (as opposed to JPQL, which queries against entity/field names).

Worth knowing as a reading-code lesson: `ShowRepository` also defines `getMostShowsMovie()` and `getAllShowsOfMovie()` — I checked, and neither is called anywhere in the codebase. They're dead code, defined but never wired to a service or controller. Real codebases accumulate this kind of thing constantly; it's a normal thing to notice and clean up, not a sign you're missing something.

## 6. Request/response DTOs & converters

**Why not just use `@Entity` classes directly in the API?** Three reasons: (1) entities carry JPA-only baggage (e.g. `Movie.shows`) you don't want serialized into every response — it can balloon payloads or cause infinite recursion; (2) you don't want a client able to set fields like `id` on create; (3) your DB schema and your API contract should be free to change independently of each other.

`request/` = shape of incoming JSON. Plain `@Data` classes, **no JPA annotations at all** — they're not tables, just JSON shapes:
```java
@Data
public class MovieRequest {
    private String movieName;
    private Integer duration;
    private Double rating;
    private Date releaseDate;
    private Genre genre;
    private Language language;
}
```

`converter/` maps by hand, with static methods:
```java
public class MovieConvertor {
    public static Movie movieDtoToMovie(MovieRequest movieRequest) {
        return Movie.builder()
                .movieName(movieRequest.getMovieName())
                .duration(movieRequest.getDuration())
                .genre(movieRequest.getGenre())
                .language(movieRequest.getLanguage())
                .releaseDate(movieRequest.getReleaseDate())
                .rating(movieRequest.getRating())
                .build();
    }
}
```
Manual mapping is fine and very readable at this scale. Past ~5-6 entities, look into MapStruct (an annotation-based mapper generator) to stop hand-writing this — good to know it exists, not something you need on day one.

`TicketConvertor` is the most interesting one: it assembles a `TicketResponse` from *two* entities (`Show` and `Ticket`) at once — a good example of a converter doing real assembly work, not just 1:1 field copying.

## 7. Service layer — the business logic

**Why an interface (`MovieService`) *and* an implementation (`MovieServiceImpl`)?** The controller depends on the interface, not the concrete class — so in tests you can swap in a mock implementation without touching the controller. It's a standard convention in Spring codebases, though plenty of small projects skip the interface entirely; you'll see both styles in the wild.

The centerpiece — `TicketServiceImpl.ticketBooking`:
```java
@Override
public TicketResponse ticketBooking(TicketRequest ticketRequest) {
    Show show = showRepository.findById(ticketRequest.getShowId())
                    .orElseThrow(ShowDoesNotExists::new);
    User user = userRepository.findById(ticketRequest.getUserId())
                    .orElseThrow(UserDoesNotExists::new);

    if (!isSeatAvailable(show.getShowSeatList(), ticketRequest.getRequestSeats())) {
        throw new SeatsNotAvailable();
    }

    Integer totalPrice = getPriceAndAssignSeats(show.getShowSeatList(), ticketRequest.getRequestSeats());
    Ticket ticket = new Ticket();
    ticket.setTotalTicketsPrice(totalPrice);
    ticket.setBookedSeats(listToString(ticketRequest.getRequestSeats()));
    ticket.setUser(user);
    ticket.setShow(show);
    ticket = ticketRepository.save(ticket);
    // ...updates both sides of the relationship, saves user + show again

    return TicketConvertor.returnTicket(show, ticket);
}
```
(Written here with `.orElseThrow(...)` in place of the repo's `if (opt.isEmpty()) throw ...` — same behavior, just the more idiomatic form worth knowing.) The two private helpers matter as much as the public method: `isSeatAvailable` loops the show's seats and checks each requested seat number's `isAvailable` flag; `getPriceAndAssignSeats` loops again, sums the price of the requested seats, and flips each to unavailable. **These run as two separate, unlocked steps** — flagged in detail in [section 12](#12-what-to-imitate-what-to-fix), since it's the single most important thing to design around in your own project.

Two more things worth clocking as you read the other services: `UserServiceImpl.addUser` hardcodes the encoded password to the literal string `"1234"` instead of the user's own password (and `UserRequest` doesn't even have a `password` field to submit one) — don't copy this part, it's a real gap, not a pattern. And `TheaterServiceImpl.addTheaterSeat` is a good example of a service method that's mostly plain Java logic (a row/column seat-numbering loop), not just database calls — not every service method is a thin CRUD wrapper.

## 8. Controller layer — the REST API

- `@RestController` = `@Controller` + `@ResponseBody` — every method's return value is serialized straight into the HTTP response body (JSON), instead of resolving to a view template.
- `@RequestMapping("/movie")` — base path prefix for the whole class.
- `@PostMapping("/addNew")` — handles `POST /movie/addNew`.
- `@RequestBody` — deserializes the incoming JSON into your Java object.
- `ResponseEntity<T>` — lets you control status code and body together.

```java
@RestController
@RequestMapping("/movie")
public class MovieController {
    @Autowired private MovieService movieService;

    @PostMapping("/addNew")
    public ResponseEntity<String> addMovie(@RequestBody MovieRequest movieRequest) {
        try {
            String result = movieService.addMovie(movieRequest);
            return new ResponseEntity<>(result, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}
```
`ShowController`, `TheaterController`, `TicketController`, `UserController` all follow this exact shape — same try/catch, same `ResponseEntity` pattern, just different request/response types. Once you've read one, you've read all five.

Two gaps worth flagging while they're fresh: that try/catch is copy-pasted into every single method across every controller — exactly what `@RestControllerAdvice` exists to centralize (see [section 12](#12-what-to-imitate-what-to-fix)). And every endpoint in this project is `POST` — there's no `GET` to list movies or look up a show, no `PUT` to edit, no `DELETE`. Real CRUD needs all four verbs.

## 9. Exception handling

Nine custom exceptions, all the same shape — extend `RuntimeException`, hardcode a message in the constructor:
```java
public class MovieAlreadyExist extends RuntimeException {
    public MovieAlreadyExist() {
        super("Movie is already exists with same name and language");
    }
}
```
Why `RuntimeException` (unchecked) rather than a checked `Exception`? Checked exceptions get awkward through Spring's layers — you'd have to declare `throws X` up through service *and* controller, or wrap them. Unchecked exceptions propagate freely and get caught wherever's convenient — here, in each controller's `catch` block; in a global handler (see step 6 of the build guide below), by `@ExceptionHandler(MovieAlreadyExist.class)`.

## 10. Security — JWT authentication

**The concept first:** instead of the server keeping a session in memory per logged-in user, it hands the client a signed token after login. The client sends that token on every future request; the server verifies the signature and trusts the claims inside without needing to remember anything about that user between requests. That's what `SessionCreationPolicy.STATELESS` in `SecurityConfiguration` means.

- **`JWTService`** — `generateToken()` creates a JWT valid for 30 minutes, signed with a symmetric HMAC key. That key is a hardcoded `SECRET` constant in the source file — flagging this clearly: hardcoding a signing secret in source code (and committing it to git) is a real security problem, even in a learning project. Real projects read secrets from environment variables or a secrets manager, never from a constant.
- **`JwtAuthFilter`** — runs once per request (`OncePerRequestFilter`), pulls the `Bearer` token off the `Authorization` header, and if it's valid, manually populates Spring Security's `SecurityContextHolder` so the rest of the framework treats the request as authenticated.
- **`SecurityConfiguration`** — the rulebook for which URLs need which role:
```java
.authorizeHttpRequests(req -> req
    .requestMatchers("/user/**").permitAll()
    .requestMatchers("/movie/**").hasAnyAuthority("ROLE_ADMIN")
    .requestMatchers("/show/**").hasAnyAuthority("ROLE_ADMIN")
    .requestMatchers("/theater/**").hasAnyAuthority("ROLE_ADMIN")
    .requestMatchers("/ticket/**").hasAnyAuthority("ROLE_USER")
    .anyRequest().authenticated())
```
Signing up is open to anyone; managing movies/theaters/shows needs `ROLE_ADMIN`; booking a ticket needs `ROLE_USER`.
- **`UserInfoUserDetails` / `UserInfoUserDetailsService`** — adapt your own `User` entity to the shape Spring Security expects (`UserDetails`), splitting the comma-separated `roles` string into a list of `GrantedAuthority`.

**The gap worth knowing about**: there's an `AuthRequest` DTO sitting in the `controllers/` package, and `JWTService.generateToken()` is fully written — but I checked, and nothing in the codebase ever calls `generateToken()`. There's no `POST /login` endpoint. Sign-up works; actually getting a token to use against the protected endpoints doesn't, as the repo stands. Here's the missing piece, written out (this is *not* in the repo — it's what you'd add):
```java
@RestController
public class AuthController {
    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JWTService jwtService;

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody AuthRequest authRequest) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword()));
        if (authentication.isAuthenticated()) {
            return ResponseEntity.ok(jwtService.generateToken(authRequest.getUsername()));
        }
        throw new RuntimeException("Invalid credentials");
    }
}
```

## 11. Tracing one request end-to-end: `POST /ticket/book`

Request:
```json
{ "showId": 1, "userId": 2, "requestSeats": ["1A", "1B", "2A"] }
```
1. `JwtAuthFilter` checks the `Bearer` token, confirms `ROLE_USER` — request proceeds.
2. `TicketController.ticketBooking` receives the deserialized `TicketRequest`.
3. `TicketServiceImpl.ticketBooking`: loads the `Show` (throws if missing) → loads the `User` (throws if missing) → checks all three seats are available (throws `SeatsNotAvailable` if not) → sums their prices and flips each to unavailable → builds and saves a `Ticket` → updates both sides of the relationship and saves again.
4. `TicketConvertor.returnTicket` assembles a flat `TicketResponse` from the `Show` + `Ticket`.
5. Controller wraps it as `201 CREATED`.

Response:
```json
{
  "time": "18:00:00", "date": "2024-09-01",
  "movieName": "Inception", "theaterName": "CineMax",
  "address": "123 Main Street, Springfield",
  "bookedSeats": "1A,1B,2A,", "totalPrice": 300
}
```

## 12. What to imitate, what to fix

**Patterns worth copying as-is:**
- Layered architecture (controller → service → repository)
- DTOs + converters instead of exposing entities directly
- Interface + Impl for services
- Custom exceptions with meaningful messages
- Stateless JWT auth with role-based URL rules
- Enums for fixed value sets, always `EnumType.STRING`

**Gaps worth knowing about and designing around, roughly in order of how much they matter for a booking system:**

1. **No concurrency control on seat booking.** `isSeatAvailable` and `getPriceAndAssignSeats` run as two separate, unlocked steps. Two simultaneous requests for the same seat can both pass the availability check before either saves — a double booking. This is *the* central problem in real ticket-booking systems, and it's the one worth solving deliberately rather than copying.
2. **No idempotency handling.** A retried booking request (network timeout, double-click, client retry logic) has nothing stopping it from creating a duplicate ticket or duplicate charge.
3. **No `@Transactional`** on multi-step service methods — a failure partway through a booking can leave half-saved data instead of rolling back cleanly.
4. **No global exception handler** — every controller repeats the same try/catch.
5. **Login endpoint never wired up** — `generateToken()` exists, nothing calls it.
6. **`UserServiceImpl` hardcodes the password** to `"1234"`, and `UserRequest` has no `password` field at all.
7. **No request validation** — you can `POST` a movie with an empty name; nothing checks.
8. **Only `POST` endpoints anywhere** — no `GET`/`PUT`/`DELETE`, so no real CRUD.
9. **`bookedSeats` as a raw comma-joined string** instead of a proper seat–ticket join table.
10. **Hardcoded JWT signing secret** in source code.

None of this makes the project "bad" — it's honest, working, beginner-scoped code, and reading real gaps like these is more useful than reading an idealized version that hides them. The next section turns each of these into something you actively build correctly.

## 13. Step-by-step: build your own project

**Step 1 — Scaffold.** [start.spring.io](https://start.spring.io) → Java 17, Maven → dependencies: Spring Web, Spring Data JPA, PostgreSQL Driver, Lombok, Validation. Add Spring Security, JWT, and springdoc-openapi *later*, once basic CRUD works — security is friction you don't need while you're still shaping the domain.

**Step 2 — Start smaller than the full IRCTC clone.** Cut a 2-3 entity vertical slice first — say `Train` + `Seat` + `Booking` — and get it working end-to-end (entity → repo → service → controller → tested in Postman) before growing it. Starting with the full domain is the most common way beginners stall out.

**Step 3 — Design entities and relationships on paper first.** Sketch your own ER diagram before writing a single `@Entity`. Decide your ownership direction (who holds the foreign key) up front — it's the thing that's most annoying to change later.

**Step 4 — Build bottom-up, testing as you go**: entity → repository → service → controller, hitting each new endpoint in Postman or Swagger as soon as it exists, rather than writing everything and testing at the end.

**Step 5 — Add validation from day one.** `@NotBlank`, `@Min`, `@Email` on your request DTOs, `@Valid` on the controller parameter. Cheap now, annoying to retrofit once you have real data.

**Step 6 — Add one global exception handler** instead of try/catch in every controller method:
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(SeatsNotAvailable.class)
    public ResponseEntity<String> handleSeatsNotAvailable(SeatsNotAvailable ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
    // one @ExceptionHandler per exception type, or a catch-all for RuntimeException
}
```

**Step 7 — Add JWT security** once unauthenticated CRUD works, following the pattern from section 10 — plus the login endpoint this reference repo is missing.

**Step 8 — Solve concurrency on booking.** This is the step that matters most for your goal. Three real options, from simplest-and-strongest to most scalable:
- **Unique DB constraint** on `(show_id, seat_no)` in your booked-seats table. The database itself refuses a second write for the same seat, no matter what your Java code does — catch the constraint-violation exception and turn it into a clean "seat taken" response.
- **Pessimistic locking** — `@Lock(LockModeType.PESSIMISTIC_WRITE)` on the query that fetches the seat inside a `@Transactional` method. The row is locked for the transaction's duration; a concurrent request simply waits, then sees the updated state.
- **Optimistic locking** — add `@Version` to the seat entity; JPA checks the version hasn't changed on save and throws if two writers collided, and you catch that and retry or report the conflict.

A unique constraint as your hard guarantee, paired with either locking strategy for a clean user-facing error instead of a raw SQL exception, is a solid combination for a portfolio project.

**Step 9 — Idempotent payment/booking handling.** Client generates a UUID as an idempotency key per booking attempt and sends it in a header. Server stores `key → result` the first time it processes that key; any retry with the same key returns the stored result instead of reprocessing. (Stripe's API docs describe this pattern well if you want the canonical reference.)

**Step 10 — Wrap multi-step service methods in `@Transactional`** so a failure partway through rolls back everything instead of leaving partially-saved data.

**Step 11 — Test the thing you actually built this for.** A couple of `@SpringBootTest`/`MockMvc` tests for the core booking flow, and specifically one that fires two concurrent booking requests at the same seat and asserts only one succeeds — that's the test that proves your concurrency fix actually works, not just that it compiles.

**Step 12 — Deploy.** Railway or Render's free tiers both handle a Spring Boot + Postgres portfolio project comfortably for demo purposes.
