package com.fluxfund.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(properties = {
		"app.security.jwt.secret=YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE="
})
@Testcontainers
class ApiApplicationTests {

	@Container
	static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(
			"postgres:17-alpine");

	@DynamicPropertySource
	static void configureDatabase(
			DynamicPropertyRegistry registry) {

		registry.add(
				"spring.datasource.url",
				postgres::getJdbcUrl);

		registry.add(
				"spring.datasource.username",
				postgres::getUsername);

		registry.add(
				"spring.datasource.password",
				postgres::getPassword);
	}

	@Test
	void contextLoads() {
	}
}