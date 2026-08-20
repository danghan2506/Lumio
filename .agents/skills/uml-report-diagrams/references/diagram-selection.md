# Diagram Selection and Scope

## Minimal Sets

| Report need | Recommended set |
| --- | --- |
| Small CRUD or mobile project | Use Case, ER, one Sequence, Component |
| Workflow-heavy system | Use Case, Activity per key workflow, Sequence, ER |
| Complex business rules | Use Case, Class, State, Sequence, Component |
| Cloud-integrated system | Use Case, Sequence, Component, Deployment, ER |

Use one diagram for each distinct question. Do not produce all UML diagram types by default.

## Evidence Order

Use the strongest available evidence in this order:

1. Database migrations, schema, and API contracts.
2. Implemented code and routing.
3. Approved functional requirements or user stories.
4. Wireframes and meeting notes.
5. Explicitly labeled proposed assumptions.

## Scale Rules

- Keep a use-case diagram to about 5–12 primary use cases; split by actor area when needed.
- Keep a class diagram focused on 6–15 core domain classes/entities; move auxiliary details to a second diagram.
- Limit sequence diagrams to one success path plus material alternatives.
- Use activity diagrams when the process is the subject; use sequence diagrams when responsibility and message order are the subject.
- Use an ER diagram for database tables and foreign keys; do not imply inheritance or behavior there.

## Common Errors

- Do not connect a user directly to a database unless that connection is genuinely implemented.
- Do not use `include` or `extend` as decorative arrows. `include` is mandatory reused behavior; `extend` is optional/conditional behavior.
- Do not translate database foreign keys into class inheritance.
- Do not show frontend components as domain classes.
- Do not add a generic `Admin` actor without an actual administrative role or use case.
