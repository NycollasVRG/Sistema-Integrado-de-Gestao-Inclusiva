FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /workspace

COPY mvnw pom.xml ./
COPY .mvn .mvn

RUN sed -i 's/\r$//' mvnw .mvn/wrapper/maven-wrapper.properties && \
    chmod +x mvnw && \
    ./mvnw dependency:go-offline -B

COPY src src
RUN ./mvnw clean package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine AS runtime

LABEL maintainer="Equipe SIGI/CLAI - IFPB"
LABEL description="Backend API do Sistema Integrado de Gestão Inclusiva (Java 21 / Spring Boot)"

RUN apk add --no-cache wget tzdata && \
    addgroup -S sigi && adduser -S sigi -G sigi

ENV TZ=America/Fortaleza
WORKDIR /app

RUN mkdir -p /app/storage/anexos && \
    chown -R sigi:sigi /app

COPY --from=build --chown=sigi:sigi /workspace/target/*.jar app.jar

USER sigi

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
