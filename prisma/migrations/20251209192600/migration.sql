-- CreateIndex
CREATE INDEX `Ekiden_Team_Predict_Ekiden_no_teamId_idx` ON `Ekiden_Team_Predict`(`Ekiden_no_teamId`);

-- AddForeignKey
ALTER TABLE `Ekiden_no_team` ADD CONSTRAINT `Ekiden_no_team_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `ekiden_th_interval` RENAME INDEX `Ekiden_th_interval_Ekiden_thId_fkey` TO `Ekiden_th_interval_Ekiden_thId_idx`;
