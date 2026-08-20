---
name: uml-report-diagrams
description: Create accurate, report-ready UML diagrams for IT projects, capstone theses, software design documents, and technical reports. Use when Codex needs to analyze requirements or an existing codebase and produce Use Case, Class, Sequence, Activity, State, Component, Deployment, ER, or package diagrams in PlantUML, with Vietnamese or English captions and concise report explanations.
---

# UML Report Diagrams

Create UML artifacts that are internally consistent, traceable to real requirements or code, and readable in an academic report.

## Workflow

1. Inspect the brief, requirements, schema, API contracts, and relevant source code.
2. State assumptions only where materials leave a material ambiguity. Ask one focused question first if a wrong assumption would alter actors, responsibilities, or persistence boundaries.
3. Select only diagrams that add evidence. Use `references/diagram-selection.md` to choose a set.
4. Create editable PlantUML source in the requested location; otherwise use `docs/diagrams/` and one `kebab-case.puml` file per diagram.
5. Add a report-ready figure title, purpose, and 2–4 sentence interpretation per diagram. Match the language of the user's prompt.
6. Validate names, data stores, APIs, and control flows against project material. Do not invent implementation details merely to complete a diagram.

## Diagram Selection

Prefer a small coherent set over a large catalog:

- **Use Case**: system scope, actors, and user-visible goals.
- **Class**: core domain entities and significant relationships; not every UI component or ORM detail.
- **Sequence**: one important end-to-end scenario, especially authentication, payment, booking, lesson completion, or AI interaction.
- **Activity**: workflow decisions, validation, retries, and alternate outcomes.
- **State**: a domain object whose valid behavior depends on lifecycle state.
- **Component**: client, backend, service boundaries, and external integrations.
- **Deployment**: runtime nodes, hosting, managed services, clients, and trust boundaries.
- **ER**: persistent data design. Use alongside a class diagram when both behavior and database structure matter.

## PlantUML Conventions

- Use `@startuml` and `@enduml`; use `left to right direction` for use cases and give each diagram one clear title.
- Use project terminology consistently across diagrams. Add stereotypes such as `<<mobile>>`, `<<api>>`, `<<database>>`, and `<<external>>` only when useful.
- Add multiplicities only when requirements, schema, or code support them.
- Use `alt`, `opt`, and `loop` in sequence diagrams for material conditional behavior. Show failure paths when they affect the scenario.
- Keep one main scenario per sequence/activity diagram. Split crowded diagrams rather than reducing readability.
- Exclude framework internals, DTO mappers, utility functions, temporary variables, and unrelated table fields.
- Use the patterns in `references/plantuml-templates.md`; replace every placeholder with verified project terminology.

## Report-Ready Output

For every diagram, provide the following near its source path or in `docs/diagrams/README.md`:

```md
### Hình X.Y — <Tên sơ đồ>

**Mục đích:** <Một câu nêu câu hỏi mà sơ đồ trả lời.>

<Đoạn 2–4 câu nêu thành phần chính, luồng/quan hệ quan trọng và ý nghĩa thiết kế.>
```

Use specific titles, for example `Sơ đồ tuần tự hoàn thành bài học`, not merely `Sequence Diagram`.

Map diagrams to a thesis outline when one exists:

- Analysis: Use Case, Activity, and ER.
- Design: Class, Sequence, Component, State, and Deployment.
- Implementation: selected Component/Deployment diagrams that reflect the actual build.

## Quality Gate

- Ensure every actor, class, service, and database exists in supplied material or is explicitly marked as an assumption.
- Ensure relationships agree with schema cardinality, API ownership, and control flow in code.
- Ensure diagrams answer distinct design questions and use a consistent vocabulary.
- Ensure captions interpret the diagram rather than repeat labels.
- Ensure PlantUML source is syntactically plausible and readable at normal report page width.

## Constraints

- Never claim rendering or visual verification unless a PlantUML renderer actually ran.
- Preserve user-provided terminology and language; define abbreviations once in prose if needed.
- If only a high-level idea is supplied, label inferred details as proposed design—not implemented facts.
