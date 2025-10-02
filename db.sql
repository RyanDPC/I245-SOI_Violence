CREATE OR REPLACE TABLE `analyse` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`Name` TINYTEXT,
	`Type_analyse` ENUM('Police', 'Ambulance', 'Pompier'),
	`Nbr_positive_necessary` TINYINT,
	PRIMARY KEY(`id`)
);

CREATE INDEX `analyse_index_0`
ON `analyse` (`id`);
CREATE OR REPLACE TABLE `camera` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`Ip_address` TINYTEXT NOT NULL,
	`Username` TINYTEXT,
	`Password` TINYTEXT,
	`Last_connexion` DATETIME NOT NULL,
	`Status` ENUM('active', 'inactive', 'maintenance', 'error') NOT NULL DEFAULT 'inactive',
	`Model` TEXT,
	PRIMARY KEY(`id`)
);

CREATE INDEX `camera_index_0`
ON `camera` (`id`);
CREATE OR REPLACE TABLE `image` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`Date` DATETIME NOT NULL,
	`URI` TINYTEXT NOT NULL,
	PRIMARY KEY(`id`)
);

CREATE INDEX `image_index_0`
ON `image` (`id`, `Date`);
CREATE OR REPLACE TABLE `resultat_analyse` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`fk_image` INTEGER NOT NULL,
	`fk_analyse` INTEGER NOT NULL,
	`result` ENUM('nothing', 'low', 'medium', 'high') NOT NULL,
	`human_verification` BOOLEAN,
	`is_resolved` BOOLEAN,
	`date` DATETIME,
	PRIMARY KEY(`id`)
);

CREATE INDEX `resultat_analyse_index_0`
ON `resultat_analyse` (`fk_image`);
CREATE OR REPLACE TABLE `Position` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`Latitude` DOUBLE NOT NULL,
	`Longitude` DOUBLE NOT NULL,
	`Label` TINYTEXT,
	PRIMARY KEY(`id`, `Latitude`, `Longitude`)
);

CREATE INDEX `Position_index_0`
ON `Position` (`Latitude`, `Longitude`, `id`);
ALTER TABLE `resultat_analyse`
ADD FOREIGN KEY(`fk_image`) REFERENCES `image`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `resultat_analyse`
ADD FOREIGN KEY(`fk_analyse`) REFERENCES `analyse`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;