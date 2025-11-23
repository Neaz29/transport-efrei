-- Schema EFREI Covoit (MySQL/MariaDB)
-- À exécuter après avoir créé la base, ex :
-- CREATE DATABASE efrei_covoit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE efrei_covoit;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  origin VARCHAR(180) NOT NULL,
  destination VARCHAR(180) NOT NULL,
  departure DATETIME NOT NULL,
  seats_total INT NOT NULL,
  seats_available INT NOT NULL,
  price DECIMAL(10,2),
  notes VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rides_user FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ride_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  ride_id INT NOT NULL,
  passenger_name VARCHAR(180) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_book_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_book_ride FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed optionnel (mot de passe "efrei123", hashé bcrypt)
INSERT INTO users (name, email, password_hash) VALUES
('Alice Etudiante', 'alice@efrei.fr', '$2a$10$Wz9jiYWlK0mZyomAbFu7SuJMeJ8YJ5bQKAqDNtE77ozaV7/wtcT36'),
('Bruno Campus', 'bruno@efrei.fr', '$2a$10$Wz9jiYWlK0mZyomAbFu7SuJMeJ8YJ5bQKAqDNtE77ozaV7/wtcT36');

-- Trajets de démonstration (heures relatives)
INSERT INTO rides (driver_id, title, origin, destination, departure, seats_total, seats_available, price, notes) VALUES
(1, 'Covoit matin depuis Paris 14', 'Paris 14e', '30-32 Av. de la République, 94800 Villejuif', DATE_ADD(UTC_TIMESTAMP(), INTERVAL 2 HOUR), 3, 3, 4, 'Depart station Glaciere, cafe offert.'),
(1, 'Retour soiree BDE', '30-32 Av. de la République, 94800 Villejuif', 'Montparnasse', DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 HOUR), 4, 4, 5, 'Playlist chill.'),
(2, 'Navette depuis Creteil', 'Creteil Universite', '136 bis Bd Maxime Gorki, 94800 Villejuif', DATE_ADD(UTC_TIMESTAMP(), INTERVAL 4 HOUR), 2, 2, 3, 'Clio bleue, badge campus visible.');
