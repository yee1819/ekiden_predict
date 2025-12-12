/*
 Warnings:
 
 - You are about to drop the column `ekiden_itemId` on the `ekiden_no_team` table. All the data in the column will be lost.
 - You are about to drop the column `Ekiden_itemId` on the `ekiden_team_predict` table. All the data in the column will be lost.
 - You are about to drop the column `ekiden_th` on the `ekiden_th` table. All the data in the column will be lost.
 - You are about to drop the column `ekiden_Student_Interval_id` on the `ekiden_th_interval` table. All the data in the column will be lost.
 - You are about to drop the column `ekiden_rangeId` on the `ekiden_th_interval` table. All the data in the column will be lost.
 - You are about to drop the column `teamId` on the `student` table. All the data in the column will be lost.
 - You are about to drop the column `ekiden_th_intervalId` on the `student_ekiden_item` table. All the data in the column will be lost.
 - You are about to drop the column `scroe` on the `student_ekiden_item` table. All the data in the column will be lost.
 - You are about to drop the `ekiden_student_interval` table. If the table is not empty, all the data it contains will be lost.
 - A unique constraint covering the columns `[schoolId,Ekiden_thId]` on the table `Ekiden_no_team` will be added. If there are existing duplicate values, this will fail.
 - A unique constraint covering the columns `[Ekiden_no_teamId,Ekiden_th_intervalId]` on the table `Ekiden_Team_Predict` will be added. If there are existing duplicate values, this will fail.
 - A unique constraint covering the columns `[Ekiden_th_intervalId,Ekiden_no_teamId]` on the table `student_ekiden_item` will be added. If there are existing duplicate values, this will fail.
 - A unique constraint covering the columns `[Ekiden_thId,studentId]` on the table `student_ekiden_item` will be added. If there are existing duplicate values, this will fail.
 - Added the required column `Ekiden_thId` to the `Ekiden_no_team` table without a default value. This is not possible if the table is not empty.
 - Added the required column `Ekiden_thId` to the `Ekiden_Team_Predict` table without a default value. This is not possible if the table is not empty.
 - Added the required column `Ekiden_th_intervalId` to the `Ekiden_Team_Predict` table without a default value. This is not possible if the table is not empty.
 - Added the required column `ekiden_intervalId` to the `Ekiden_th_interval` table without a default value. This is not possible if the table is not empty.
 - Added the required column `Ekiden_no_teamId` to the `student_ekiden_item` table without a default value. This is not possible if the table is not empty.
 - Added the required column `Ekiden_thId` to the `student_ekiden_item` table without a default value. This is not possible if the table is not empty.
 - Added the required column `Ekiden_th_intervalId` to the `student_ekiden_item` table without a default value. This is not possible if the table is not empty.
 - Added the required column `score` to the `student_ekiden_item` table without a default value. This is not possible if the table is not empty.
 
 */
-- DropForeignKey
ALTER TABLE `ekiden_no_team` DROP FOREIGN KEY `Ekiden_no_team_ekiden_itemId_fkey`;
-- DropForeignKey
ALTER TABLE `ekiden_no_team` DROP FOREIGN KEY `Ekiden_no_team_schoolId_fkey`;
-- DropForeignKey
ALTER TABLE `ekiden_student_interval` DROP FOREIGN KEY `Ekiden_Student_Interval_studentId_fkey`;
-- DropForeignKey
ALTER TABLE `ekiden_th_interval` DROP FOREIGN KEY `Ekiden_th_interval_ekiden_Student_Interval_id_fkey`;
-- DropForeignKey
ALTER TABLE `ekiden_th_interval` DROP FOREIGN KEY `Ekiden_th_interval_ekiden_rangeId_fkey`;
-- DropForeignKey
ALTER TABLE `student` DROP FOREIGN KEY `student_teamId_fkey`;
-- DropForeignKey
ALTER TABLE `student_ekiden_item` DROP FOREIGN KEY `student_ekiden_item_ekiden_th_intervalId_fkey`;
-- DropIndex
DROP INDEX `Ekiden_no_team_ekiden_itemId_idx` ON `ekiden_no_team`;
-- DropIndex
DROP INDEX `Ekiden_no_team_schoolId_ekiden_itemId_key` ON `ekiden_no_team`;
-- DropIndex
-- Ensure foreign key is removed before dropping its backing index
ALTER TABLE `Ekiden_Team_Predict` DROP FOREIGN KEY `Ekiden_Team_Predict_Ekiden_itemId_fkey`;
DROP INDEX `Ekiden_Team_Predict_Ekiden_itemId_fkey` ON `ekiden_team_predict`;
-- DropIndex
DROP INDEX `Ekiden_th_interval_ekiden_Student_Interval_id_key` ON `ekiden_th_interval`;
-- DropIndex
DROP INDEX `Ekiden_th_interval_ekiden_rangeId_fkey` ON `ekiden_th_interval`;
-- DropIndex
DROP INDEX `student_teamId_fkey` ON `student`;
-- DropIndex
DROP INDEX `student_ekiden_item_ekiden_th_intervalId_idx` ON `student_ekiden_item`;
-- DropIndex
DROP INDEX `student_ekiden_item_ekiden_th_intervalId_studentId_key` ON `student_ekiden_item`;
-- AlterTable
ALTER TABLE `ekiden_interval`
MODIFY `map` VARCHAR(191) NULL;
-- AlterTable
ALTER TABLE `ekiden_no_team` DROP COLUMN `ekiden_itemId`,
    ADD COLUMN `Ekiden_thId` INTEGER NOT NULL;
-- AlterTable
ALTER TABLE `ekiden_team_predict` DROP COLUMN `Ekiden_itemId`,
    ADD COLUMN `Ekiden_thId` INTEGER NOT NULL,
    ADD COLUMN `Ekiden_th_intervalId` INTEGER NOT NULL,
    ADD COLUMN `studentId` INTEGER NULL;
-- AlterTable
ALTER TABLE `ekiden_th` DROP COLUMN `ekiden_th`;
-- AlterTable
ALTER TABLE `ekiden_th_interval` DROP COLUMN `ekiden_Student_Interval_id`,
    DROP COLUMN `ekiden_rangeId`,
    ADD COLUMN `ekiden_intervalId` INTEGER NOT NULL;
-- AlterTable
ALTER TABLE `student` DROP COLUMN `teamId`,
    MODIFY `entryYear` INTEGER NULL;
-- AlterTable
ALTER TABLE `student_ekiden_item` DROP COLUMN `ekiden_th_intervalId`,
    DROP COLUMN `scroe`,
    ADD COLUMN `Ekiden_no_teamId` INTEGER NOT NULL,
    ADD COLUMN `Ekiden_thId` INTEGER NOT NULL,
    ADD COLUMN `Ekiden_th_intervalId` INTEGER NOT NULL,
    ADD COLUMN `score` DOUBLE NOT NULL;
-- DropTable
DROP TABLE `ekiden_student_interval`;
-- CreateTable
CREATE TABLE `Ekiden_Team_Member` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ekiden_no_teamId` INTEGER NOT NULL,
    `studentId` INTEGER NOT NULL,
    `role` ENUM('STARTER', 'RESERVE') NOT NULL,
    INDEX `Ekiden_Team_Member_studentId_idx`(`studentId`),
    UNIQUE INDEX `Ekiden_Team_Member_ekiden_no_teamId_studentId_key`(`ekiden_no_teamId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CreateIndex
CREATE INDEX `Ekiden_no_team_Ekiden_thId_idx` ON `Ekiden_no_team`(`Ekiden_thId`);
-- CreateIndex
CREATE UNIQUE INDEX `Ekiden_no_team_schoolId_Ekiden_thId_key` ON `Ekiden_no_team`(`schoolId`, `Ekiden_thId`);
-- CreateIndex
CREATE INDEX `Ekiden_Team_Predict_Ekiden_thId_idx` ON `Ekiden_Team_Predict`(`Ekiden_thId`);
-- CreateIndex
CREATE UNIQUE INDEX `Ekiden_Team_Predict_Ekiden_no_teamId_Ekiden_th_intervalId_key` ON `Ekiden_Team_Predict`(`Ekiden_no_teamId`, `Ekiden_th_intervalId`);
-- CreateIndex
CREATE INDEX `Ekiden_th_interval_ekiden_intervalId_idx` ON `Ekiden_th_interval`(`ekiden_intervalId`);
-- CreateIndex
CREATE INDEX `student_ekiden_item_Ekiden_th_intervalId_idx` ON `student_ekiden_item`(`Ekiden_th_intervalId`);
-- CreateIndex
CREATE INDEX `student_ekiden_item_Ekiden_no_teamId_idx` ON `student_ekiden_item`(`Ekiden_no_teamId`);
-- CreateIndex
CREATE INDEX `student_ekiden_item_Ekiden_thId_idx` ON `student_ekiden_item`(`Ekiden_thId`);
-- CreateIndex
CREATE UNIQUE INDEX `student_ekiden_item_Ekiden_th_intervalId_Ekiden_no_teamId_key` ON `student_ekiden_item`(`Ekiden_th_intervalId`, `Ekiden_no_teamId`);
-- CreateIndex
CREATE UNIQUE INDEX `student_ekiden_item_Ekiden_thId_studentId_key` ON `student_ekiden_item`(`Ekiden_thId`, `studentId`);
-- AddForeignKey
ALTER TABLE `student_ekiden_item`
ADD CONSTRAINT `student_ekiden_item_Ekiden_th_intervalId_fkey` FOREIGN KEY (`Ekiden_th_intervalId`) REFERENCES `Ekiden_th_interval`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `student_ekiden_item`
ADD CONSTRAINT `student_ekiden_item_Ekiden_no_teamId_fkey` FOREIGN KEY (`Ekiden_no_teamId`) REFERENCES `Ekiden_no_team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `student_ekiden_item`
ADD CONSTRAINT `student_ekiden_item_Ekiden_thId_fkey` FOREIGN KEY (`Ekiden_thId`) REFERENCES `Ekiden_th`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `Ekiden_no_team`
ADD CONSTRAINT `Ekiden_no_team_Ekiden_thId_fkey` FOREIGN KEY (`Ekiden_thId`) REFERENCES `Ekiden_th`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `Ekiden_Team_Member`
ADD CONSTRAINT `Ekiden_Team_Member_ekiden_no_teamId_fkey` FOREIGN KEY (`ekiden_no_teamId`) REFERENCES `Ekiden_no_team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `Ekiden_Team_Member`
ADD CONSTRAINT `Ekiden_Team_Member_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `Ekiden_Team_Predict`
ADD CONSTRAINT `Ekiden_Team_Predict_Ekiden_thId_fkey` FOREIGN KEY (`Ekiden_thId`) REFERENCES `Ekiden_th`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `Ekiden_Team_Predict`
ADD CONSTRAINT `Ekiden_Team_Predict_Ekiden_th_intervalId_fkey` FOREIGN KEY (`Ekiden_th_intervalId`) REFERENCES `Ekiden_th_interval`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `Ekiden_Team_Predict`
ADD CONSTRAINT `Ekiden_Team_Predict_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE
SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `Ekiden_th_interval`
ADD CONSTRAINT `Ekiden_th_interval_ekiden_intervalId_fkey` FOREIGN KEY (`ekiden_intervalId`) REFERENCES `ekiden_interval`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;