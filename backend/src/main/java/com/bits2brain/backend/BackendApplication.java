package com.bits2brain.backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class BackendApplication {
	private static final Logger logger = LoggerFactory.getLogger(BackendApplication.class);

	public static void main(String[] args) {
		// Load environment variables from .env file
		logger.info("Loading environment variables from .env file");
		Dotenv dotenv = Dotenv.configure()
				.ignoreIfMissing()
				.load();

		SpringApplication.run(BackendApplication.class, args);
	}
}
