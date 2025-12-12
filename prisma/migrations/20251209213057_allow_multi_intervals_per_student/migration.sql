-- DropForeignKey
ALTER TABLE `student_ekiden_item` DROP FOREIGN KEY `student_ekiden_item_Ekiden_thId_fkey`;

-- DropIndex
DROP INDEX `student_ekiden_item_Ekiden_thId_studentId_key` ON `student_ekiden_item`;

-- AddForeignKey
ALTER TABLE `Ekiden_Team_Predict` ADD CONSTRAINT `Ekiden_Team_Predict_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
