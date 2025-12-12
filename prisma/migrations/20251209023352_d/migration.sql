/*
  Warnings:

  - You are about to drop the column `Ekiden_itemId` on the `ekiden_th_interval` table. All the data in the column will be lost.
  - You are about to drop the column `ekidenRangeId` on the `student_ekiden_item` table. All the data in the column will be lost.
  - You are about to drop the column `ekiden_itemId` on the `student_ekiden_item` table. All the data in the column will be lost.
  - You are about to drop the `ekiden_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ekiden_range` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[ekiden_th_intervalId,studentId]` on the table `student_ekiden_item` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `Ekiden_thId` to the `Ekiden_th_interval` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ekiden_th_intervalId` to the `student_ekiden_item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `ekiden_item` DROP FOREIGN KEY `Ekiden_item_ekidenId_fkey`;

-- DropForeignKey
ALTER TABLE `ekiden_no_team` DROP FOREIGN KEY `Ekiden_no_team_ekiden_itemId_fkey`;

-- DropForeignKey
ALTER TABLE `ekiden_range` DROP FOREIGN KEY `ekiden_range_ekidenId_fkey`;

-- DropForeignKey
ALTER TABLE `ekiden_team_predict` DROP FOREIGN KEY `Ekiden_Team_Predict_Ekiden_itemId_fkey`;

-- DropForeignKey
ALTER TABLE `ekiden_th_interval` DROP FOREIGN KEY `Ekiden_th_interval_Ekiden_itemId_fkey`;

-- DropForeignKey
ALTER TABLE `ekiden_th_interval` DROP FOREIGN KEY `Ekiden_th_interval_ekiden_rangeId_fkey`;

-- DropForeignKey
ALTER TABLE `student_ekiden_item` DROP FOREIGN KEY `student_ekiden_item_ekidenRangeId_fkey`;

-- DropForeignKey
ALTER TABLE `student_ekiden_item` DROP FOREIGN KEY `student_ekiden_item_ekiden_itemId_fkey`;

-- DropIndex
DROP INDEX `Ekiden_Team_Predict_Ekiden_itemId_fkey` ON `ekiden_team_predict`;

-- DropIndex
DROP INDEX `Ekiden_th_interval_Ekiden_itemId_fkey` ON `ekiden_th_interval`;

-- DropIndex
DROP INDEX `Ekiden_th_interval_ekiden_rangeId_fkey` ON `ekiden_th_interval`;

-- DropIndex
DROP INDEX `student_ekiden_item_ekidenRangeId_fkey` ON `student_ekiden_item`;

-- DropIndex
DROP INDEX `student_ekiden_item_ekiden_itemId_idx` ON `student_ekiden_item`;

-- DropIndex
DROP INDEX `student_ekiden_item_ekiden_itemId_studentId_key` ON `student_ekiden_item`;

-- AlterTable
ALTER TABLE `ekiden_th_interval` DROP COLUMN `Ekiden_itemId`,
    ADD COLUMN `Ekiden_thId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `student_ekiden_item` DROP COLUMN `ekidenRangeId`,
    DROP COLUMN `ekiden_itemId`,
    ADD COLUMN `ekiden_th_intervalId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `ekiden_item`;

-- DropTable
DROP TABLE `ekiden_range`;

-- CreateTable
CREATE TABLE `ekiden_interval` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `kilometer` DOUBLE NOT NULL,
    `record` DOUBLE NOT NULL,
    `map` VARCHAR(191) NOT NULL,
    `start_point` VARCHAR(191) NULL,
    `end_point` VARCHAR(191) NULL,
    `ekidenId` INTEGER NOT NULL,

    INDEX `ekiden_interval_ekidenId_idx`(`ekidenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ekiden_th` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ekiden_th` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `ekidenId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `student_ekiden_item_ekiden_th_intervalId_idx` ON `student_ekiden_item`(`ekiden_th_intervalId`);

-- CreateIndex
CREATE UNIQUE INDEX `student_ekiden_item_ekiden_th_intervalId_studentId_key` ON `student_ekiden_item`(`ekiden_th_intervalId`, `studentId`);

-- AddForeignKey
ALTER TABLE `ekiden_interval` ADD CONSTRAINT `ekiden_interval_ekidenId_fkey` FOREIGN KEY (`ekidenId`) REFERENCES `ekiden`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ekiden_th` ADD CONSTRAINT `Ekiden_th_ekidenId_fkey` FOREIGN KEY (`ekidenId`) REFERENCES `ekiden`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_ekiden_item` ADD CONSTRAINT `student_ekiden_item_ekiden_th_intervalId_fkey` FOREIGN KEY (`ekiden_th_intervalId`) REFERENCES `Ekiden_th_interval`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ekiden_no_team` ADD CONSTRAINT `Ekiden_no_team_ekiden_itemId_fkey` FOREIGN KEY (`ekiden_itemId`) REFERENCES `Ekiden_th`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ekiden_Team_Predict` ADD CONSTRAINT `Ekiden_Team_Predict_Ekiden_itemId_fkey` FOREIGN KEY (`Ekiden_itemId`) REFERENCES `Ekiden_th`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ekiden_th_interval` ADD CONSTRAINT `Ekiden_th_interval_Ekiden_thId_fkey` FOREIGN KEY (`Ekiden_thId`) REFERENCES `Ekiden_th`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ekiden_th_interval` ADD CONSTRAINT `Ekiden_th_interval_ekiden_rangeId_fkey` FOREIGN KEY (`ekiden_rangeId`) REFERENCES `ekiden_interval`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
