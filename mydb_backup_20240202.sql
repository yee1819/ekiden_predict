-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: localhost    Database: ekiden_yuce
-- ------------------------------------------------------
-- Server version	8.0.38

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('262e6c2e-f432-48f9-ae88-14b4d97136e8','2bc6a3f819c429bd561a12b621c39c45c8f18b58a953f967b84955fde2202045','2025-12-09 19:23:46.577','20251209023352_d',NULL,NULL,'2025-12-09 19:23:45.473',1),('34e8086a-6452-41c3-8364-32fe20d1fc6b','7d10f0fbf380ee39458366d61247c9658488cac8003c122218f44113c88cf83a','2025-12-09 19:23:48.363','20251209191851',NULL,NULL,'2025-12-09 19:23:46.582',1),('6980ff2f-6355-42c1-89f8-f6e936a27a0a','128c20e4ccc304edf0c9fac3651fa29f055c4c3789c113ce37434a05e0d56f2e','2025-12-09 19:26:00.848','20251209192600',NULL,NULL,'2025-12-09 19:26:00.688',1),('6f593dfb-00d1-44d2-8991-c728ae04853b','4e07911e533d187612d49582989aa436c6c7209a1ebf4ae5c9b4699ede7079b4','2025-12-09 20:40:30.945','20251209204030_add_required_team_members',NULL,NULL,'2025-12-09 20:40:30.913',1),('8883951d-2af6-46ab-99ac-8b149edbac66','8991a7da428758d12adf23d1c85793fbfc67c70ba0aa13404879d18449bb3d82','2025-12-09 19:23:45.467','20251209011913_init',NULL,NULL,'2025-12-09 19:23:43.320',1),('935135e7-d64c-4b5f-9a6c-1488978a899f','eac82bc679a1bba726e29d6f0d02d57238ab10684c0c947ee48c986dc9539657','2025-12-09 20:02:01.406','20251209200201_add_ekiden_th_column',NULL,NULL,'2025-12-09 20:02:01.367',1),('b9625a36-7d2a-489b-98f3-5f6896332dd6','3519a83d4ef70ddd955df744e3956242af1f9c27f9362125afa1a2e3dfd0b832',NULL,'20251209213057_allow_multi_intervals_per_student','A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251209213057_allow_multi_intervals_per_student\n\nDatabase error code: 1826\n\nDatabase error:\nDuplicate foreign key constraint name \'Ekiden_Team_Predict_studentId_fkey\'\n\nPlease check the query number 3 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20251209213057_allow_multi_intervals_per_student\"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name=\"20251209213057_allow_multi_intervals_per_student\"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:246',NULL,'2025-12-09 21:30:57.943',0);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account`
--

DROP TABLE IF EXISTS `account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accountId` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `providerId` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accessToken` text COLLATE utf8mb4_unicode_ci,
  `refreshToken` text COLLATE utf8mb4_unicode_ci,
  `idToken` text COLLATE utf8mb4_unicode_ci,
  `accessTokenExpiresAt` datetime(3) DEFAULT NULL,
  `refreshTokenExpiresAt` datetime(3) DEFAULT NULL,
  `scope` text COLLATE utf8mb4_unicode_ci,
  `password` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `account_userId_idx` (`userId`),
  CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account`
--

LOCK TABLES `account` WRITE;
/*!40000 ALTER TABLE `account` DISABLE KEYS */;
INSERT INTO `account` VALUES ('STwUBGqrkBFA5BosaWr7h4QsFpnxRv4V','t32leeDbTDWoDbJQmlMD0wh9fqAb8z0C','credential','t32leeDbTDWoDbJQmlMD0wh9fqAb8z0C',NULL,NULL,NULL,NULL,NULL,NULL,'b22154ec804cc823db64bbe1c94c73ae:d62f72052485ed4acbd33e919933f2abb34fd1cb77d5193667a8a81b7a3b89aef481dd3b1f2dcf07401cb8347658180ef388ae707804dd7ba59bb937fd19b735','2025-12-11 14:26:45.292','2025-12-11 14:26:45.292');
/*!40000 ALTER TABLE `account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ekiden`
--

DROP TABLE IF EXISTS `ekiden`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ekiden` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `required_team_members` int NOT NULL DEFAULT '16',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ekiden`
--

LOCK TABLES `ekiden` WRITE;
/*!40000 ALTER TABLE `ekiden` DISABLE KEYS */;
INSERT INTO `ekiden` VALUES (3,'箱根','',16),(4,'全日本','',16),(5,'出雲','',10);
/*!40000 ALTER TABLE `ekiden` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ekiden_interval`
--

DROP TABLE IF EXISTS `ekiden_interval`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ekiden_interval` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kilometer` double NOT NULL,
  `record` double NOT NULL,
  `map` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_point` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `end_point` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ekidenId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ekiden_interval_ekidenId_idx` (`ekidenId`),
  CONSTRAINT `ekiden_interval_ekidenId_fkey` FOREIGN KEY (`ekidenId`) REFERENCES `ekiden` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ekiden_interval`
--

LOCK TABLES `ekiden_interval` WRITE;
/*!40000 ALTER TABLE `ekiden_interval` DISABLE KEYS */;
INSERT INTO `ekiden_interval` VALUES (3,'一区','',21.3,3640,NULL,NULL,NULL,3),(4,'二区','',23.1,3931,NULL,NULL,NULL,3),(5,'三区','',21.4,3565,NULL,NULL,NULL,3),(6,'四区','',20.9,3600,NULL,NULL,NULL,3),(7,'五区','',20.8,4151,NULL,NULL,NULL,3),(8,'六区','',20.8,3407,NULL,NULL,NULL,3),(9,'七区','',21.3,3643,NULL,NULL,NULL,3),(10,'八区','',21.4,3829,NULL,NULL,NULL,3),(11,'九区','',23.1,4035,NULL,NULL,NULL,3),(12,'十区','',23,4070,NULL,NULL,NULL,3),(17,'一区','',9.5,1618,NULL,NULL,NULL,4),(18,'二区','',11.1,1861,NULL,NULL,NULL,4),(19,'三区','',11.9,1966,NULL,NULL,NULL,4),(20,'四区','',11.8,1983,NULL,NULL,NULL,4),(21,'五区','',11.8,2101,NULL,NULL,NULL,4),(22,'六区','',12.8,2207,NULL,NULL,NULL,4),(23,'七区','',17.6,2971,NULL,NULL,NULL,4),(24,'八区','',19.7,3332,NULL,NULL,NULL,4),(27,'一区','',8,1350,NULL,NULL,NULL,5),(28,'二区','',5.8,927,NULL,NULL,NULL,5),(29,'三区','',8.5,1416,NULL,NULL,NULL,5),(30,'四区','',6.2,1040,NULL,NULL,NULL,5),(31,'五区','',6.4,1063,NULL,NULL,NULL,5),(32,'六区','',10.2,1697,NULL,NULL,NULL,5);
/*!40000 ALTER TABLE `ekiden_interval` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ekiden_no_team`
--

DROP TABLE IF EXISTS `ekiden_no_team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ekiden_no_team` (
  `id` int NOT NULL AUTO_INCREMENT,
  `schoolId` int NOT NULL,
  `coach` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `leader` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Ekiden_thId` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Ekiden_no_team_schoolId_Ekiden_thId_key` (`schoolId`,`Ekiden_thId`),
  KEY `Ekiden_no_team_schoolId_idx` (`schoolId`),
  KEY `Ekiden_no_team_Ekiden_thId_idx` (`Ekiden_thId`),
  CONSTRAINT `Ekiden_no_team_Ekiden_thId_fkey` FOREIGN KEY (`Ekiden_thId`) REFERENCES `ekiden_th` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Ekiden_no_team_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ekiden_no_team`
--

LOCK TABLES `ekiden_no_team` WRITE;
/*!40000 ALTER TABLE `ekiden_no_team` DISABLE KEYS */;
INSERT INTO `ekiden_no_team` VALUES (14,5,'','',9),(15,5,'','',8),(16,5,'','',7),(17,5,'','',6),(18,5,'','',17),(19,5,'','',18),(20,5,'','',19),(21,5,'','',20),(22,5,'','',10),(23,5,'','',11),(24,5,'','',12),(25,5,'','',13),(26,6,'','',9);
/*!40000 ALTER TABLE `ekiden_no_team` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ekiden_team_member`
--

DROP TABLE IF EXISTS `ekiden_team_member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ekiden_team_member` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ekiden_no_teamId` int NOT NULL,
  `studentId` int NOT NULL,
  `role` enum('STARTER','RESERVE') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Ekiden_Team_Member_ekiden_no_teamId_studentId_key` (`ekiden_no_teamId`,`studentId`),
  KEY `Ekiden_Team_Member_studentId_idx` (`studentId`),
  CONSTRAINT `Ekiden_Team_Member_ekiden_no_teamId_fkey` FOREIGN KEY (`ekiden_no_teamId`) REFERENCES `ekiden_no_team` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Ekiden_Team_Member_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=222 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ekiden_team_member`
--

LOCK TABLES `ekiden_team_member` WRITE;
/*!40000 ALTER TABLE `ekiden_team_member` DISABLE KEYS */;
INSERT INTO `ekiden_team_member` VALUES (37,14,70,'RESERVE'),(38,14,71,'RESERVE'),(39,14,72,'RESERVE'),(40,14,73,'RESERVE'),(41,14,75,'RESERVE'),(42,14,77,'RESERVE'),(43,14,78,'RESERVE'),(44,14,80,'RESERVE'),(45,14,81,'RESERVE'),(46,14,82,'RESERVE'),(47,14,83,'RESERVE'),(48,14,87,'RESERVE'),(49,14,88,'RESERVE'),(50,14,89,'RESERVE'),(51,14,93,'RESERVE'),(52,14,94,'RESERVE'),(53,15,64,'RESERVE'),(54,15,65,'RESERVE'),(55,15,66,'RESERVE'),(56,15,67,'RESERVE'),(57,15,68,'RESERVE'),(58,15,69,'RESERVE'),(59,15,70,'RESERVE'),(60,15,71,'RESERVE'),(61,15,72,'RESERVE'),(62,15,73,'RESERVE'),(63,15,75,'RESERVE'),(64,15,77,'RESERVE'),(65,15,82,'RESERVE'),(66,15,84,'RESERVE'),(67,15,85,'RESERVE'),(68,15,87,'RESERVE'),(69,16,56,'RESERVE'),(70,16,57,'RESERVE'),(71,16,58,'RESERVE'),(72,16,59,'RESERVE'),(73,16,63,'RESERVE'),(74,16,65,'RESERVE'),(75,16,66,'RESERVE'),(76,16,67,'RESERVE'),(77,16,68,'RESERVE'),(78,16,69,'RESERVE'),(79,16,70,'RESERVE'),(80,16,72,'RESERVE'),(81,16,73,'RESERVE'),(82,16,74,'RESERVE'),(83,16,75,'RESERVE'),(84,16,77,'RESERVE'),(85,17,43,'RESERVE'),(86,17,44,'RESERVE'),(87,17,45,'RESERVE'),(88,17,46,'RESERVE'),(89,17,47,'RESERVE'),(90,17,48,'RESERVE'),(91,17,49,'RESERVE'),(92,17,53,'RESERVE'),(93,17,54,'RESERVE'),(94,17,59,'RESERVE'),(95,17,65,'RESERVE'),(96,17,66,'RESERVE'),(97,17,70,'RESERVE'),(98,17,73,'RESERVE'),(100,17,75,'RESERVE'),(101,17,68,'RESERVE'),(102,18,70,'RESERVE'),(103,18,72,'RESERVE'),(104,18,75,'RESERVE'),(105,18,80,'RESERVE'),(106,18,81,'RESERVE'),(107,18,83,'RESERVE'),(108,18,85,'RESERVE'),(109,18,87,'RESERVE'),(110,18,90,'RESERVE'),(111,18,92,'RESERVE'),(112,19,64,'RESERVE'),(113,19,65,'RESERVE'),(114,19,66,'RESERVE'),(115,19,67,'RESERVE'),(116,19,69,'RESERVE'),(117,19,70,'RESERVE'),(118,19,72,'RESERVE'),(119,19,75,'RESERVE'),(120,19,77,'RESERVE'),(121,19,80,'RESERVE'),(122,20,56,'RESERVE'),(123,20,57,'RESERVE'),(124,20,58,'RESERVE'),(125,20,59,'RESERVE'),(126,20,64,'RESERVE'),(127,20,65,'RESERVE'),(128,20,66,'RESERVE'),(129,20,69,'RESERVE'),(130,20,70,'RESERVE'),(131,20,80,'RESERVE'),(132,21,43,'RESERVE'),(133,21,44,'RESERVE'),(134,21,47,'RESERVE'),(135,21,52,'RESERVE'),(136,21,53,'RESERVE'),(137,21,58,'RESERVE'),(138,21,61,'RESERVE'),(139,21,64,'RESERVE'),(140,21,68,'RESERVE'),(141,21,69,'RESERVE'),(142,22,70,'RESERVE'),(143,22,71,'RESERVE'),(144,22,72,'RESERVE'),(145,22,73,'RESERVE'),(146,22,75,'RESERVE'),(147,22,77,'RESERVE'),(148,22,79,'RESERVE'),(149,22,80,'RESERVE'),(150,22,81,'RESERVE'),(151,22,83,'RESERVE'),(152,22,85,'RESERVE'),(153,22,87,'RESERVE'),(154,22,90,'RESERVE'),(155,22,91,'RESERVE'),(156,22,92,'RESERVE'),(157,22,93,'RESERVE'),(158,23,64,'RESERVE'),(159,23,65,'RESERVE'),(160,23,66,'RESERVE'),(161,23,67,'RESERVE'),(162,23,68,'RESERVE'),(163,23,69,'RESERVE'),(164,23,70,'RESERVE'),(165,23,72,'RESERVE'),(166,23,74,'RESERVE'),(167,23,75,'RESERVE'),(168,23,77,'RESERVE'),(169,23,79,'RESERVE'),(170,23,81,'RESERVE'),(171,23,84,'RESERVE'),(172,23,85,'RESERVE'),(173,23,88,'RESERVE'),(174,24,56,'RESERVE'),(175,24,58,'RESERVE'),(176,24,59,'RESERVE'),(177,24,60,'RESERVE'),(178,24,64,'RESERVE'),(179,24,65,'RESERVE'),(180,24,66,'RESERVE'),(181,24,68,'RESERVE'),(182,24,69,'RESERVE'),(183,24,70,'RESERVE'),(184,24,72,'RESERVE'),(185,24,73,'RESERVE'),(186,24,75,'RESERVE'),(187,24,76,'RESERVE'),(188,24,77,'RESERVE'),(189,24,80,'RESERVE'),(190,25,43,'RESERVE'),(191,25,44,'RESERVE'),(192,25,45,'RESERVE'),(193,25,46,'RESERVE'),(194,25,47,'RESERVE'),(195,25,51,'RESERVE'),(196,25,52,'RESERVE'),(197,25,53,'RESERVE'),(198,25,57,'RESERVE'),(199,25,59,'RESERVE'),(200,25,61,'RESERVE'),(201,25,67,'RESERVE'),(202,25,68,'RESERVE'),(203,25,69,'RESERVE'),(204,25,70,'RESERVE'),(205,25,75,'RESERVE'),(206,26,97,'RESERVE'),(207,26,98,'RESERVE'),(208,26,99,'RESERVE'),(209,26,100,'RESERVE'),(210,26,101,'RESERVE'),(211,26,102,'RESERVE'),(212,26,105,'RESERVE'),(213,26,106,'RESERVE'),(214,26,107,'RESERVE'),(215,26,108,'RESERVE'),(216,26,109,'RESERVE'),(217,26,112,'RESERVE'),(218,26,113,'RESERVE'),(219,26,114,'RESERVE'),(220,26,115,'RESERVE'),(221,26,117,'RESERVE');
/*!40000 ALTER TABLE `ekiden_team_member` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ekiden_team_predict`
--

DROP TABLE IF EXISTS `ekiden_team_predict`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ekiden_team_predict` (
  `id` int NOT NULL AUTO_INCREMENT,
  `Ekiden_no_teamId` int NOT NULL,
  `Ekiden_thId` int NOT NULL,
  `Ekiden_th_intervalId` int NOT NULL,
  `studentId` int DEFAULT NULL,
  `predict_score_sec` int DEFAULT NULL,
  `userName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ipAddress` text COLLATE utf8mb4_unicode_ci,
  `opinion` text COLLATE utf8mb4_unicode_ci,
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `batchId` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `Ekiden_Team_Predict_Ekiden_thId_idx` (`Ekiden_thId`),
  KEY `Ekiden_Team_Predict_Ekiden_th_intervalId_fkey` (`Ekiden_th_intervalId`),
  KEY `Ekiden_Team_Predict_studentId_fkey` (`studentId`),
  KEY `Ekiden_Team_Predict_Ekiden_no_teamId_idx` (`Ekiden_no_teamId`),
  CONSTRAINT `Ekiden_Team_Predict_Ekiden_no_teamId_fkey` FOREIGN KEY (`Ekiden_no_teamId`) REFERENCES `ekiden_no_team` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Ekiden_Team_Predict_Ekiden_th_intervalId_fkey` FOREIGN KEY (`Ekiden_th_intervalId`) REFERENCES `ekiden_th_interval` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Ekiden_Team_Predict_Ekiden_thId_fkey` FOREIGN KEY (`Ekiden_thId`) REFERENCES `ekiden_th` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Ekiden_Team_Predict_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ekiden_team_predict`
--

LOCK TABLES `ekiden_team_predict` WRITE;
/*!40000 ALTER TABLE `ekiden_team_predict` DISABLE KEYS */;
INSERT INTO `ekiden_team_predict` VALUES (1,14,9,73,72,3600,'你猜1','2025-12-12 01:06:15.639','::1',NULL,'2025-12-11 17:09:49.172',NULL),(2,14,9,74,89,3780,'你猜1','2025-12-12 01:06:15.639','::1',NULL,'2025-12-11 17:09:49.205',NULL),(3,14,9,75,81,3600,'你猜1','2025-12-12 01:06:15.639','::1',NULL,'2025-12-11 17:09:49.220',NULL),(4,14,9,76,83,3600,'你猜1','2025-12-12 01:06:15.639','::1',NULL,'2025-12-11 17:09:49.232',NULL),(5,14,9,77,70,3900,'你猜1','2025-12-12 01:06:15.639','::1',NULL,'2025-12-11 17:09:49.246',NULL),(6,14,9,78,93,3600,'你猜1','2025-12-12 01:06:15.639','::1',NULL,'2025-12-11 17:09:49.259',NULL),(7,14,9,79,82,3600,'你猜1','2025-12-12 01:06:15.639','::1',NULL,'2025-12-11 17:09:49.271',NULL),(8,14,9,80,75,3660,'你猜1','2025-12-12 01:06:15.639','::1',NULL,'2025-12-11 17:09:49.283',NULL),(9,14,9,81,73,3900,'你猜1','2025-12-12 01:06:15.639','::1',NULL,'2025-12-11 17:09:49.298',NULL),(10,14,9,82,87,3900,'你猜1','2025-12-12 01:06:15.639','::1',NULL,'2025-12-11 17:09:49.313',NULL),(11,26,9,73,109,NULL,'你猜1','2025-12-11 20:05:36.588','::1','1','2025-12-11 20:05:36.588','1765483536581-f3do12jeom'),(12,26,9,74,114,NULL,'你猜1','2025-12-11 20:05:36.626','::1','1','2025-12-11 20:05:36.626','1765483536581-f3do12jeom'),(13,26,9,75,112,NULL,'你猜1','2025-12-11 20:05:36.642','::1','1','2025-12-11 20:05:36.642','1765483536581-f3do12jeom'),(14,26,9,76,113,NULL,'你猜1','2025-12-11 20:05:36.652','::1','1','2025-12-11 20:05:36.652','1765483536581-f3do12jeom'),(15,26,9,77,102,NULL,'你猜1','2025-12-11 20:05:36.661','::1','1','2025-12-11 20:05:36.661','1765483536581-f3do12jeom'),(16,26,9,78,115,NULL,'你猜1','2025-12-11 20:05:36.669','::1','1','2025-12-11 20:05:36.669','1765483536581-f3do12jeom'),(17,26,9,79,99,NULL,'你猜1','2025-12-11 20:05:36.677','::1','1','2025-12-11 20:05:36.677','1765483536581-f3do12jeom'),(18,26,9,80,100,NULL,'你猜1','2025-12-11 20:05:36.683','::1','1','2025-12-11 20:05:36.683','1765483536581-f3do12jeom'),(19,26,9,81,107,NULL,'你猜1','2025-12-11 20:05:36.689','::1','1','2025-12-11 20:05:36.689','1765483536581-f3do12jeom'),(20,26,9,82,101,NULL,'你猜1','2025-12-11 20:05:36.694','::1','1','2025-12-11 20:05:36.694','1765483536581-f3do12jeom'),(21,26,9,73,109,NULL,'你猜1','2025-12-11 20:08:33.717','::1','1','2025-12-11 20:08:33.717','1765483713709-vxk864jdg2'),(22,26,9,74,114,NULL,'你猜1','2025-12-11 20:08:33.779','::1','1','2025-12-11 20:08:33.779','1765483713709-vxk864jdg2'),(23,26,9,75,112,NULL,'你猜1','2025-12-11 20:08:33.808','::1','1','2025-12-11 20:08:33.808','1765483713709-vxk864jdg2'),(24,26,9,76,113,NULL,'你猜1','2025-12-11 20:08:33.830','::1','1','2025-12-11 20:08:33.830','1765483713709-vxk864jdg2'),(25,26,9,77,102,NULL,'你猜1','2025-12-11 20:08:33.849','::1','1','2025-12-11 20:08:33.849','1765483713709-vxk864jdg2'),(26,26,9,78,115,NULL,'你猜1','2025-12-11 20:08:33.870','::1','1','2025-12-11 20:08:33.870','1765483713709-vxk864jdg2'),(27,26,9,79,99,NULL,'你猜1','2025-12-11 20:08:33.889','::1','1','2025-12-11 20:08:33.889','1765483713709-vxk864jdg2'),(28,26,9,80,100,NULL,'你猜1','2025-12-11 20:08:33.917','::1','1','2025-12-11 20:08:33.917','1765483713709-vxk864jdg2'),(29,26,9,81,107,NULL,'你猜1','2025-12-11 20:08:33.942','::1','1','2025-12-11 20:08:33.942','1765483713709-vxk864jdg2'),(30,26,9,82,101,NULL,'你猜1','2025-12-11 20:08:33.966','::1','1','2025-12-11 20:08:33.966','1765483713709-vxk864jdg2'),(31,14,9,73,87,NULL,'你猜1','2025-12-11 20:39:41.147','::1','我猜是这样哈哈哈哈','2025-12-11 20:39:41.147','1765485581144-5cdj9kwf8nv'),(32,14,9,74,88,NULL,'你猜1','2025-12-11 20:39:41.180','::1','我猜是这样哈哈哈哈','2025-12-11 20:39:41.180','1765485581144-5cdj9kwf8nv'),(33,14,9,75,93,NULL,'你猜1','2025-12-11 20:39:41.190','::1','我猜是这样哈哈哈哈','2025-12-11 20:39:41.190','1765485581144-5cdj9kwf8nv'),(34,14,9,76,83,NULL,'你猜1','2025-12-11 20:39:41.197','::1','我猜是这样哈哈哈哈','2025-12-11 20:39:41.197','1765485581144-5cdj9kwf8nv'),(35,14,9,77,77,NULL,'你猜1','2025-12-11 20:39:41.205','::1','我猜是这样哈哈哈哈','2025-12-11 20:39:41.205','1765485581144-5cdj9kwf8nv'),(36,14,9,78,71,NULL,'你猜1','2025-12-11 20:39:41.215','::1','我猜是这样哈哈哈哈','2025-12-11 20:39:41.215','1765485581144-5cdj9kwf8nv'),(37,14,9,79,80,NULL,'你猜1','2025-12-11 20:39:41.222','::1','我猜是这样哈哈哈哈','2025-12-11 20:39:41.222','1765485581144-5cdj9kwf8nv'),(38,14,9,80,72,NULL,'你猜1','2025-12-11 20:39:41.230','::1','我猜是这样哈哈哈哈','2025-12-11 20:39:41.230','1765485581144-5cdj9kwf8nv'),(39,14,9,81,82,NULL,'你猜1','2025-12-11 20:39:41.238','::1','我猜是这样哈哈哈哈','2025-12-11 20:39:41.238','1765485581144-5cdj9kwf8nv'),(40,14,9,82,81,NULL,'你猜1','2025-12-11 20:39:41.245','::1','我猜是这样哈哈哈哈','2025-12-11 20:39:41.245','1765485581144-5cdj9kwf8nv'),(41,14,9,73,81,NULL,'拉拉3g','2025-12-11 20:53:31.329','::1',NULL,'2025-12-11 20:53:31.329','1765486411327-z6cjibgw7kc'),(42,14,9,74,82,NULL,'拉拉3g','2025-12-11 20:53:31.357','::1',NULL,'2025-12-11 20:53:31.357','1765486411327-z6cjibgw7kc'),(43,14,9,75,77,NULL,'拉拉3g','2025-12-11 20:53:31.375','::1',NULL,'2025-12-11 20:53:31.375','1765486411327-z6cjibgw7kc'),(44,14,9,76,93,NULL,'拉拉3g','2025-12-11 20:53:31.391','::1',NULL,'2025-12-11 20:53:31.391','1765486411327-z6cjibgw7kc'),(45,14,9,77,78,NULL,'拉拉3g','2025-12-11 20:53:31.409','::1',NULL,'2025-12-11 20:53:31.409','1765486411327-z6cjibgw7kc'),(46,14,9,78,75,NULL,'拉拉3g','2025-12-11 20:53:31.426','::1',NULL,'2025-12-11 20:53:31.426','1765486411327-z6cjibgw7kc'),(47,14,9,79,87,NULL,'拉拉3g','2025-12-11 20:53:31.440','::1',NULL,'2025-12-11 20:53:31.440','1765486411327-z6cjibgw7kc'),(48,14,9,80,83,NULL,'拉拉3g','2025-12-11 20:53:31.450','::1',NULL,'2025-12-11 20:53:31.450','1765486411327-z6cjibgw7kc'),(49,14,9,81,89,NULL,'拉拉3g','2025-12-11 20:53:31.463','::1',NULL,'2025-12-11 20:53:31.463','1765486411327-z6cjibgw7kc'),(50,14,9,82,94,NULL,'拉拉3g','2025-12-11 20:53:31.472','::1',NULL,'2025-12-11 20:53:31.472','1765486411327-z6cjibgw7kc');
/*!40000 ALTER TABLE `ekiden_team_predict` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ekiden_th`
--

DROP TABLE IF EXISTS `ekiden_th`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ekiden_th` (
  `id` int NOT NULL AUTO_INCREMENT,
  `year` int NOT NULL,
  `ekidenId` int NOT NULL,
  `ekiden_th` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Ekiden_th_ekidenId_fkey` (`ekidenId`),
  CONSTRAINT `Ekiden_th_ekidenId_fkey` FOREIGN KEY (`ekidenId`) REFERENCES `ekiden` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ekiden_th`
--

LOCK TABLES `ekiden_th` WRITE;
/*!40000 ALTER TABLE `ekiden_th` DISABLE KEYS */;
INSERT INTO `ekiden_th` VALUES (3,2019,3,96),(4,2020,3,97),(5,2021,3,98),(6,2022,3,99),(7,2023,3,100),(8,2024,3,101),(9,2025,3,102),(10,2025,4,57),(11,2024,4,56),(12,2023,4,55),(13,2022,4,54),(14,2021,4,53),(15,2020,4,52),(16,2019,4,51),(17,2025,5,37),(18,2024,5,36),(19,2023,5,35),(20,2022,5,34),(21,2021,5,33),(22,2019,5,31);
/*!40000 ALTER TABLE `ekiden_th` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ekiden_th_interval`
--

DROP TABLE IF EXISTS `ekiden_th_interval`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ekiden_th_interval` (
  `id` int NOT NULL AUTO_INCREMENT,
  `Ekiden_thId` int NOT NULL,
  `ekiden_intervalId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Ekiden_th_interval_Ekiden_thId_idx` (`Ekiden_thId`),
  KEY `Ekiden_th_interval_ekiden_intervalId_idx` (`ekiden_intervalId`),
  CONSTRAINT `Ekiden_th_interval_ekiden_intervalId_fkey` FOREIGN KEY (`ekiden_intervalId`) REFERENCES `ekiden_interval` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Ekiden_th_interval_Ekiden_thId_fkey` FOREIGN KEY (`Ekiden_thId`) REFERENCES `ekiden_th` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ekiden_th_interval`
--

LOCK TABLES `ekiden_th_interval` WRITE;
/*!40000 ALTER TABLE `ekiden_th_interval` DISABLE KEYS */;
INSERT INTO `ekiden_th_interval` VALUES (13,8,12),(14,8,11),(15,8,10),(16,8,9),(17,8,8),(18,8,7),(19,8,6),(20,8,5),(21,8,4),(22,8,3),(23,7,12),(24,7,11),(25,7,10),(26,7,9),(27,7,8),(28,7,7),(29,7,6),(30,7,5),(31,7,4),(32,7,3),(33,6,12),(34,6,11),(35,6,10),(36,6,9),(37,6,8),(38,6,7),(39,6,6),(40,6,5),(41,6,4),(42,6,3),(43,17,32),(44,17,31),(45,17,30),(46,17,29),(47,17,28),(48,17,27),(49,10,24),(50,10,23),(51,10,22),(52,10,21),(53,10,20),(54,10,19),(55,10,18),(56,10,17),(57,11,24),(58,11,23),(59,11,22),(60,11,21),(61,11,20),(62,11,19),(63,11,18),(64,11,17),(65,12,24),(66,12,23),(67,12,22),(68,12,21),(69,12,20),(70,12,19),(71,12,18),(72,12,17),(73,9,3),(74,9,4),(75,9,5),(76,9,6),(77,9,7),(78,9,8),(79,9,9),(80,9,10),(81,9,11),(82,9,12);
/*!40000 ALTER TABLE `ekiden_th_interval` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `school`
--

DROP TABLE IF EXISTS `school`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `school` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `school`
--

LOCK TABLES `school` WRITE;
/*!40000 ALTER TABLE `school` DISABLE KEYS */;
INSERT INTO `school` VALUES (5,'青山学院大学'),(6,'駒澤大学'),(7,'國學院大學'),(9,'早稲田大学'),(10,'中央大学'),(11,'城西大学'),(12,'創価大学'),(13,'東京国際大学'),(14,'東洋大学'),(15,'帝京大学	'),(16,'順天堂大学'),(17,'日本体育大学'),(18,'立教大学'),(19,'中央学院大学'),(20,'法政大学'),(21,'神奈川大学'),(22,'専修大学'),(23,'山梨学院大学'),(24,'大東文化大学'),(25,'日本大学'),(26,'関東学生連合'),(27,'東海大学'),(28,'国士舘大学'),(29,'駿河台大学'),(30,'明治大学'),(31,'東京農業大学'),(32,'拓殖大学'),(33,'筑波大学');
/*!40000 ALTER TABLE `school` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS `session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `ipAddress` text COLLATE utf8mb4_unicode_ci,
  `userAgent` text COLLATE utf8mb4_unicode_ci,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token_key` (`token`),
  KEY `session_userId_idx` (`userId`),
  CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `session`
--

LOCK TABLES `session` WRITE;
/*!40000 ALTER TABLE `session` DISABLE KEYS */;
INSERT INTO `session` VALUES ('a0jpluEZ4MjBLc2jSWOrOfxdT9Wp3ulo','2025-12-19 08:34:51.945','hFhF0s54zygbktYTjgt4kNSmOPZ9axsA','2025-12-12 08:34:51.946','2025-12-12 08:34:51.946','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0','t32leeDbTDWoDbJQmlMD0wh9fqAb8z0C');
/*!40000 ALTER TABLE `session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student`
--

DROP TABLE IF EXISTS `student`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `schoolId` int NOT NULL,
  `score_1500m` double DEFAULT NULL,
  `score_5000m` double DEFAULT NULL,
  `score_10000m` double DEFAULT NULL,
  `score_half_marathon` double DEFAULT NULL,
  `score_full_marathon` double DEFAULT NULL,
  `entryYear` int DEFAULT NULL,
  `score_college_pb` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_schoolId_idx` (`schoolId`),
  CONSTRAINT `student_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=187 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student`
--

LOCK TABLES `student` WRITE;
/*!40000 ALTER TABLE `student` DISABLE KEYS */;
INSERT INTO `student` VALUES (43,'近藤幸太郎',5,NULL,NULL,NULL,NULL,NULL,2019,NULL),(44,'目片将大',5,NULL,NULL,NULL,NULL,NULL,2019,NULL),(45,'岸本大紀',5,NULL,NULL,NULL,NULL,NULL,2019,NULL),(46,'西久保遼',5,NULL,NULL,NULL,NULL,NULL,2019,NULL),(47,'横田俊吾',5,NULL,NULL,NULL,NULL,NULL,2019,NULL),(48,'西川魁星',5,NULL,NULL,NULL,NULL,NULL,2019,NULL),(49,'脇田幸太朗',5,NULL,NULL,NULL,NULL,NULL,2019,NULL),(50,'大澤佑介',5,NULL,NULL,NULL,NULL,NULL,2019,NULL),(51,'関口雄大',5,NULL,NULL,NULL,NULL,NULL,2019,NULL),(52,'宮坂大器',5,NULL,NULL,NULL,NULL,NULL,2019,NULL),(53,'中村唯翔',5,NULL,NULL,NULL,NULL,NULL,2019,NULL),(54,'中倉啓敦',5,NULL,NULL,NULL,NULL,NULL,2019,NULL),(55,'鈴木竜太朗',5,NULL,NULL,NULL,NULL,NULL,2020,NULL),(56,'小原響',5,NULL,NULL,NULL,NULL,NULL,2020,NULL),(57,'倉本玄太',5,NULL,NULL,NULL,NULL,NULL,2020,NULL),(58,'山内健登',5,NULL,NULL,NULL,NULL,NULL,2020,NULL),(59,'佐藤一世',5,NULL,NULL,NULL,NULL,NULL,2020,NULL),(60,'佐々木塁',5,NULL,NULL,NULL,NULL,NULL,2020,NULL),(61,'志貴勇斗',5,NULL,NULL,NULL,NULL,NULL,2020,NULL),(62,'池田知史',5,NULL,NULL,NULL,NULL,NULL,2020,NULL),(63,'松並昂勢',5,NULL,NULL,NULL,NULL,NULL,2020,NULL),(64,'鶴川正也',5,NULL,NULL,NULL,NULL,NULL,2021,NULL),(65,'若林宏樹',5,NULL,NULL,NULL,NULL,NULL,2021,NULL),(66,'太田蒼生',5,NULL,NULL,NULL,NULL,NULL,2021,NULL),(67,'白石光星',5,NULL,NULL,NULL,NULL,NULL,2021,NULL),(68,'田中悠登',5,NULL,NULL,NULL,NULL,NULL,2021,NULL),(69,'野村昭夢',5,NULL,NULL,NULL,NULL,NULL,2021,NULL),(70,'黒田朝日',5,NULL,809.56,1657.62,3699,7565,2022,NULL),(71,'佐藤有一',5,NULL,833.61,1687.75,3833,NULL,2022,NULL),(72,'宇田川瞬矢',5,NULL,817.71,1669.9,3740,NULL,2022,NULL),(73,'荒巻朋熙',5,NULL,834.32,1688.26,3791,NULL,2022,NULL),(74,'皆渡星七',5,NULL,NULL,NULL,NULL,NULL,2022,NULL),(75,'塩出翔太',5,NULL,829.56,1735.81,3714,NULL,2022,NULL),(76,'神田大地',5,NULL,NULL,NULL,NULL,NULL,2022,NULL),(77,'平松享祐',5,NULL,826.06,1705.01,3724,NULL,2023,NULL),(78,'中村海斗',5,NULL,843.19,1729.4,3728,NULL,2023,NULL),(79,'熊井渓人',5,NULL,NULL,NULL,NULL,NULL,2023,NULL),(80,'鳥井健太',5,NULL,816.73,1690.02,3743,NULL,2023,NULL),(81,'折田壮太',5,NULL,808.78,1663.92,3771,NULL,2024,NULL),(82,'佐藤愛斗',5,NULL,824.48,1675.93,3717,NULL,2024,NULL),(83,'飯田翔大',5,NULL,814.2,1671.51,3798,NULL,2024,NULL),(84,'黒田然',5,NULL,NULL,NULL,NULL,NULL,2024,NULL),(85,'安島莉玖',5,NULL,NULL,NULL,NULL,NULL,2024,NULL),(86,'佐々木大輝',5,NULL,NULL,NULL,NULL,NULL,2024,NULL),(87,'小河原陽琉',5,NULL,821.76,1717.01,3734,NULL,2024,NULL),(88,'遠藤大成',5,NULL,838.03,1719.12,3793,NULL,2024,NULL),(89,'上野山拳士朗',5,NULL,832.93,1700.82,NULL,NULL,2025,NULL),(90,'神邑亮佑',5,NULL,NULL,NULL,NULL,NULL,2025,NULL),(91,'前川竜之将',5,NULL,NULL,NULL,NULL,NULL,2025,NULL),(92,'椙山一颯',5,NULL,NULL,NULL,NULL,NULL,2025,NULL),(93,'石川浩輝',5,NULL,828.21,NULL,NULL,NULL,2025,NULL),(94,'松田祐真',5,NULL,838.6,NULL,NULL,NULL,2025,NULL),(95,'橋本颯人',6,NULL,NULL,NULL,NULL,NULL,2025,NULL),(96,'牟田颯太',6,NULL,NULL,NULL,NULL,NULL,2025,NULL),(97,'篠和真',6,NULL,NULL,NULL,NULL,NULL,2025,NULL),(98,'牟田凜太',6,NULL,NULL,NULL,NULL,NULL,2025,NULL),(99,'谷中晴',6,NULL,NULL,NULL,NULL,NULL,2024,NULL),(100,'桑田駿介',6,NULL,NULL,NULL,NULL,NULL,2024,NULL),(101,'菅谷希弥',6,NULL,NULL,NULL,NULL,NULL,2024,NULL),(102,'坂口雄哉',6,NULL,NULL,NULL,NULL,NULL,2024,NULL),(103,'小松聖',6,NULL,NULL,NULL,NULL,NULL,2023,NULL),(104,'白井恒成',6,NULL,NULL,NULL,NULL,NULL,2023,NULL),(105,'植阪嶺児',6,NULL,NULL,NULL,NULL,NULL,2023,NULL),(106,'安原海晴',6,NULL,NULL,NULL,NULL,NULL,2023,NULL),(107,'村上響',6,NULL,NULL,NULL,NULL,NULL,2023,NULL),(108,'新谷倖生',6,NULL,NULL,NULL,NULL,NULL,2023,NULL),(109,'小山翔也',6,NULL,NULL,NULL,NULL,NULL,2023,NULL),(110,'工藤信太朗',6,NULL,NULL,NULL,NULL,NULL,2023,NULL),(111,'島子公佑',6,NULL,NULL,NULL,NULL,NULL,2023,NULL),(112,'佐藤圭汰',6,NULL,NULL,NULL,NULL,NULL,2022,NULL),(113,'帰山侑大',6,NULL,NULL,NULL,NULL,NULL,2022,NULL),(114,'山川拓馬',6,NULL,NULL,NULL,NULL,NULL,2022,NULL),(115,'伊藤蒼唯',6,NULL,NULL,NULL,NULL,NULL,2022,NULL),(116,'山口真玄',6,NULL,NULL,NULL,NULL,NULL,2022,NULL),(117,'森重清龍',6,NULL,NULL,NULL,NULL,NULL,2022,NULL),(118,'野田顕臣',7,NULL,NULL,NULL,NULL,NULL,2025,NULL),(119,'高石樹',7,NULL,NULL,NULL,NULL,NULL,2025,NULL),(120,'中川晴喜',7,NULL,NULL,NULL,NULL,NULL,2024,NULL),(121,'鼻野木悠翔',7,NULL,NULL,NULL,NULL,NULL,2024,NULL),(122,'浅野結太',7,NULL,NULL,NULL,NULL,NULL,2024,NULL),(123,'岡村享一',7,NULL,NULL,NULL,NULL,NULL,2024,NULL),(124,'塚本瑞起',7,NULL,NULL,NULL,NULL,NULL,2024,NULL),(125,'飯國新太',7,NULL,NULL,NULL,NULL,NULL,2024,NULL),(126,'尾熊迅斗',7,NULL,NULL,NULL,NULL,NULL,2024,NULL),(127,'児玉虎太郎',7,NULL,NULL,NULL,NULL,NULL,2023,NULL),(128,'吉田蔵之介',7,NULL,NULL,NULL,NULL,NULL,2023,NULL),(129,'山倉良太',7,NULL,NULL,NULL,NULL,NULL,2023,NULL),(130,'田中愛睦',7,NULL,NULL,NULL,NULL,NULL,2023,NULL),(131,'後村光星',7,NULL,NULL,NULL,NULL,NULL,2023,NULL),(132,'辻原輝',7,NULL,NULL,NULL,NULL,NULL,2023,NULL),(133,'野中恒亨',7,NULL,NULL,NULL,NULL,NULL,2023,NULL),(134,'森田隼也',7,NULL,NULL,NULL,NULL,NULL,2022,NULL),(135,'鎌田匠馬',7,NULL,NULL,NULL,NULL,NULL,2022,NULL),(136,'田中登馬',7,NULL,NULL,NULL,NULL,NULL,2022,NULL),(137,'渡辺峻平',7,NULL,NULL,NULL,NULL,NULL,2022,NULL),(138,'嘉数純平',7,NULL,NULL,NULL,NULL,NULL,2022,NULL),(139,'上原琉翔',7,NULL,NULL,NULL,NULL,NULL,2022,NULL),(140,'高山豪起',7,NULL,NULL,NULL,NULL,NULL,2022,NULL),(141,'青木瑠郁',7,NULL,NULL,NULL,NULL,NULL,2022,NULL),(142,'佐々木哲',9,NULL,NULL,NULL,NULL,NULL,2025,NULL),(143,'堀野正太',9,NULL,NULL,NULL,NULL,NULL,2025,NULL),(144,'鈴木琉胤',9,NULL,NULL,NULL,NULL,NULL,2025,NULL),(145,'山田晃央',9,NULL,NULL,NULL,NULL,NULL,2025,NULL),(146,'多田真',9,NULL,NULL,NULL,NULL,NULL,2025,NULL),(147,'立迫大徳',9,NULL,NULL,NULL,NULL,NULL,2024,NULL),(148,'山口竣平',9,NULL,NULL,NULL,NULL,NULL,2024,NULL),(149,'瀬間元輔',9,NULL,NULL,NULL,NULL,NULL,2024,NULL),(150,'吉倉ナヤブ直希',9,NULL,NULL,NULL,NULL,NULL,2024,NULL),(151,'小平敦之',9,NULL,NULL,NULL,NULL,NULL,2023,NULL),(152,'宮本優希',9,NULL,NULL,NULL,NULL,NULL,2023,NULL),(153,'長屋匡起',9,NULL,NULL,NULL,NULL,NULL,2023,NULL),(154,'増子陽季',9,NULL,NULL,NULL,NULL,NULL,2023,NULL),(155,'武田知典',9,NULL,NULL,NULL,NULL,NULL,2023,NULL),(156,'山崎一吹',9,NULL,NULL,NULL,NULL,NULL,2023,NULL),(157,'工藤慎作',9,NULL,NULL,NULL,NULL,NULL,2023,NULL),(158,'山口智規',9,NULL,NULL,NULL,NULL,NULL,2022,NULL),(159,'間瀬田純平',9,NULL,NULL,NULL,NULL,NULL,2022,NULL),(160,'伊藤幸太郎',9,NULL,NULL,NULL,NULL,NULL,2022,NULL),(161,'藤本進次郎',9,NULL,NULL,NULL,NULL,NULL,2022,NULL),(162,'宮岡凜太',9,NULL,NULL,NULL,NULL,NULL,2022,NULL),(163,'須山向陽',9,NULL,NULL,NULL,NULL,NULL,2022,NULL),(164,'杉本憲亮',10,NULL,NULL,NULL,NULL,NULL,2025,NULL),(165,'三宅悠斗',10,NULL,NULL,NULL,NULL,NULL,2025,NULL),(166,'辻誉',10,NULL,NULL,NULL,NULL,NULL,2025,NULL),(167,'濵口大和',10,NULL,NULL,NULL,NULL,NULL,2025,NULL),(168,'田原琥太郎',10,NULL,NULL,NULL,NULL,NULL,2024,NULL),(169,'原田望睦',10,NULL,NULL,NULL,NULL,NULL,2024,NULL),(170,'七枝直',10,NULL,NULL,NULL,NULL,NULL,2024,NULL),(171,'並川颯太',10,NULL,NULL,NULL,NULL,NULL,2024,NULL),(172,'佐藤大介',10,NULL,NULL,NULL,NULL,NULL,2024,NULL),(173,'岡田開成',10,NULL,NULL,NULL,NULL,NULL,2024,NULL),(174,'山崎草太',10,NULL,NULL,NULL,NULL,NULL,2023,NULL),(175,'本間颯',10,NULL,NULL,NULL,NULL,NULL,2023,NULL),(176,'藤田大智',10,NULL,NULL,NULL,NULL,NULL,2023,NULL),(177,'鈴木耕太郎',10,NULL,NULL,NULL,NULL,NULL,2023,NULL),(178,'佐藤蓮',10,NULL,NULL,NULL,NULL,NULL,2023,NULL),(179,'柴田大地',10,NULL,NULL,NULL,NULL,NULL,2023,NULL),(180,'折居幸成',10,NULL,NULL,NULL,NULL,NULL,2022,NULL),(181,'佐藤宏亮',10,NULL,NULL,NULL,NULL,NULL,2022,NULL),(182,'白川陽大',10,NULL,NULL,NULL,NULL,NULL,2022,NULL),(183,'伊東夢翔',10,NULL,NULL,NULL,NULL,NULL,2022,NULL),(184,'吉中祐太',10,NULL,NULL,NULL,NULL,NULL,2022,NULL),(185,'溜池一太',10,NULL,NULL,NULL,NULL,NULL,2022,NULL),(186,'吉居駿恭',10,NULL,NULL,NULL,NULL,NULL,2022,NULL);
/*!40000 ALTER TABLE `student` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_ekiden_item`
--

DROP TABLE IF EXISTS `student_ekiden_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_ekiden_item` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rank` int NOT NULL,
  `grade` enum('ONE','TWO','THREE','FOUR') COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` int NOT NULL,
  `Ekiden_no_teamId` int NOT NULL,
  `Ekiden_thId` int NOT NULL,
  `Ekiden_th_intervalId` int NOT NULL,
  `score` double NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_ekiden_item_Ekiden_th_intervalId_Ekiden_no_teamId_key` (`Ekiden_th_intervalId`,`Ekiden_no_teamId`),
  KEY `student_ekiden_item_studentId_idx` (`studentId`),
  KEY `student_ekiden_item_Ekiden_th_intervalId_idx` (`Ekiden_th_intervalId`),
  KEY `student_ekiden_item_Ekiden_no_teamId_idx` (`Ekiden_no_teamId`),
  KEY `student_ekiden_item_Ekiden_thId_idx` (`Ekiden_thId`),
  CONSTRAINT `student_ekiden_item_Ekiden_no_teamId_fkey` FOREIGN KEY (`Ekiden_no_teamId`) REFERENCES `ekiden_no_team` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `student_ekiden_item_Ekiden_th_intervalId_fkey` FOREIGN KEY (`Ekiden_th_intervalId`) REFERENCES `ekiden_th_interval` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `student_ekiden_item_Ekiden_thId_fkey` FOREIGN KEY (`Ekiden_thId`) REFERENCES `ekiden_th` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `student_ekiden_item_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_ekiden_item`
--

LOCK TABLES `student_ekiden_item` WRITE;
/*!40000 ALTER TABLE `student_ekiden_item` DISABLE KEYS */;
INSERT INTO `student_ekiden_item` VALUES (33,1,'ONE',87,15,8,13,4107),(34,2,'FOUR',68,15,8,14,4120),(35,1,'THREE',75,15,8,15,3854),(36,9,'FOUR',67,15,8,16,3790),(37,1,'FOUR',69,15,8,17,3407),(38,1,'FOUR',65,15,8,18,4151),(39,1,'FOUR',66,15,8,19,3624),(40,4,'FOUR',64,15,8,20,3711),(41,3,'THREE',70,15,8,21,3944),(42,10,'THREE',72,15,8,22,3771),(43,2,'TWO',72,16,7,23,4161),(44,1,'FOUR',57,16,7,24,4131),(45,1,'TWO',75,16,7,25,3840),(46,3,'FOUR',58,16,7,26,3766),(47,2,'THREE',69,16,7,27,3494),(48,2,'THREE',65,16,7,28,4172),(49,1,'FOUR',59,16,7,29,3670),(50,1,'THREE',66,16,7,30,3587),(51,1,'TWO',70,16,7,31,3967),(52,9,'TWO',73,16,7,32,3697),(53,7,'FOUR',54,17,6,33,4199),(54,1,'FOUR',45,17,6,34,4047),(55,5,'TWO',68,17,6,35,3890),(56,7,'THREE',59,17,6,36,3813),(57,20,'FOUR',48,17,6,37,3803),(58,9,'FOUR',49,17,6,38,4367),(59,2,'TWO',66,17,6,39,3635),(60,8,'FOUR',47,17,6,40,3743),(61,2,'FOUR',43,17,6,41,3984),(62,7,'FOUR',44,17,6,42,3784),(63,1,'FOUR',70,18,17,43,1755),(64,1,'FOUR',75,18,17,44,1074),(65,8,'ONE',90,18,17,45,1064),(66,10,'TWO',83,18,17,46,1517),(67,10,'TWO',81,18,17,47,1016),(68,6,'TWO',87,18,17,48,1426),(69,7,'TWO',87,22,10,49,3481),(70,1,'FOUR',70,22,10,50,2971),(71,1,'TWO',83,22,10,51,2240),(72,4,'FOUR',71,22,10,52,2194),(73,7,'FOUR',75,22,10,53,2084),(74,7,'FOUR',72,22,10,54,2034),(75,10,'FOUR',73,22,10,55,1916),(76,12,'ONE',92,22,10,56,1648),(77,15,'THREE',75,23,11,57,3603),(78,2,'FOUR',66,23,11,58,3007),(79,2,'FOUR',67,23,11,59,2244),(80,4,'FOUR',68,23,11,60,2181),(81,1,'THREE',70,23,11,61,1983),(82,5,'ONE',81,23,11,62,2058),(83,1,'FOUR',64,23,11,63,1864),(84,4,'FOUR',69,23,11,64,1701),(85,3,'THREE',68,24,12,65,3535),(86,5,'THREE',66,24,12,66,3101),(87,3,'TWO',73,24,12,67,2262),(88,4,'FOUR',58,24,12,68,2172),(89,7,'FOUR',56,24,12,69,2105),(90,8,'FOUR',59,24,12,70,2063),(91,2,'TWO',70,24,12,71,1869),(92,8,'THREE',65,24,12,72,1647);
/*!40000 ALTER TABLE `student_ekiden_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `emailVerified` tinyint(1) NOT NULL DEFAULT '0',
  `image` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('t32leeDbTDWoDbJQmlMD0wh9fqAb8z0C','admin','1244118445@qq.com',0,NULL,'2025-12-11 14:26:45.232','2025-12-11 14:26:45.232');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `verification`
--

DROP TABLE IF EXISTS `verification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `verification` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `identifier` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `verification`
--

LOCK TABLES `verification` WRITE;
/*!40000 ALTER TABLE `verification` DISABLE KEYS */;
/*!40000 ALTER TABLE `verification` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-12 17:21:49
