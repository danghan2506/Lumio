# PlantUML Templates

Replace every placeholder with project-specific terminology. Remove optional elements unsupported by evidence.

## Use Case

```plantuml
@startuml
left to right direction
title Use case — <System scope>

actor "<Primary user>" as User
actor "<External system>" as External
rectangle "<System name>" {
  usecase "<Goal>" as UC1
  usecase "<Required reused behavior>" as UC2
}
User --> UC1
UC1 .> UC2 : <<include>>
External --> UC1
@enduml
```

## Sequence

```plantuml
@startuml
title Sequence — <Scenario>

actor User
participant "Mobile app" as App
participant "API" as Api
database "Database" as Db
User -> App : <Initiate action>
App -> Api : <Request>
activate Api
Api -> Db : <Read/write>
Db --> Api : <Result>
alt <Valid condition>
  Api --> App : <Success response>
  App --> User : <Confirm outcome>
else <Invalid condition>
  Api --> App : <Safe error response>
  App --> User : <User-friendly message>
end
deactivate Api
@enduml
```

## Class

```plantuml
@startuml
title Domain class diagram — <Scope>

class "<Entity A>" {
  +id: UUID
  +<business attribute>: <Type>
  +<business operation>(): <Return type>
}
class "<Entity B>" {
  +id: UUID
  +<business attribute>: <Type>
}
"<Entity A>" "1" -- "0..*" "<Entity B>" : <relationship>
@enduml
```

## Activity

```plantuml
@startuml
title Activity — <Workflow>
start
:<Start action>;
if (<Validation succeeds?>) then (yes)
  :<Process action>;
  :<Persist or notify>;
  stop
else (no)
  :<Show validation feedback>;
  stop
endif
@enduml
```

## Component

```plantuml
@startuml
title Component diagram — <System>
component "<Mobile/Web client>" as Client <<client>>
component "<Backend/API>" as Api <<api>>
database "<Primary database>" as Db <<database>>
cloud "<External service>" as External <<external>>
Client --> Api : HTTPS
Api --> Db : SQL / SDK
Api --> External : API
@enduml
```

## Deployment

```plantuml
@startuml
title Deployment diagram — <System>
node "User device" { artifact "<Mobile app or browser>" as Client }
cloud "<Hosting platform>" { node "<Application runtime>" { artifact "<API service>" as Api } }
cloud "<Managed database platform>" { database "<Database>" as Db }
Client --> Api : HTTPS
Api --> Db : authenticated connection
@enduml
```
