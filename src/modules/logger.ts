import winston from "winston";

// TODO: Set up log file rotation

const logger = winston.createLogger({
	level: "info",
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.errors({ stack: true }),
		winston.format.splat(),
		winston.format.printf(({ timestamp, service, level, message, ...meta }) =>
			// 2025-01-01T00:00:00.000Z [ERROR] 	[service] message {"additional": "properties"}
			`${timestamp} [${level.toUpperCase()}] \t[${service ?? ""}] ${message} ${JSON.stringify(meta)}`
				.replace(/\\n/g, "\n                                        "),
		),
	),
	transports: [
		//
		// - Write all logs with importance level of `error` or higher to `error.log`
		//   (i.e., error, fatal, but not other levels)
		//
		new winston.transports.File({ filename: "logs/error.log", level: "error" }),
		//
		// - Write all logs with importance level of `info` or higher to `combined.log`
		//   (i.e., fatal, error, warn, and info, but not trace)
		//
		new winston.transports.File({ filename: "logs/combined.log" }),

		new winston.transports.Console(),
	],
});

export default logger;

export function serviceLogger(serviceName: string): winston.Logger {
	return logger.child({ service: serviceName });
}
