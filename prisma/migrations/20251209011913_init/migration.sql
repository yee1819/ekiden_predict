-- CreateTable
CREATE TABLE `ekiden` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ekiden_range` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `kilometer` DOUBLE NOT NULL,
    `record` DOUBLE NOT NULL,
    `map` VARCHAR(191) NOT NULL,
    `start_point` VARCHAR(191) NULL,
    `end_point` VARCHAR(191) NULL,
    `ekidenId` INTEGER NOT NULL,

    INDEX `ekiden_range_ekidenId_idx`(`ekidenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `schoolId` INTEGER NOT NULL,
    `teamId` INTEGER NOT NULL,
    `score_1500m` DOUBLE NULL,
    `score_5000m` DOUBLE NULL,
    `score_10000m` DOUBLE NULL,
    `score_half_marathon` DOUBLE NULL,
    `score_full_marathon` DOUBLE NULL,
    `entryYear` INTEGER NOT NULL,

    INDEX `student_schoolId_idx`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ekiden_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `year` INTEGER NOT NULL,
    `ekidenId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_ekiden_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `scroe` DOUBLE NOT NULL,
    `rank` INTEGER NOT NULL,
    `grade` ENUM('ONE', 'TWO', 'THREE', 'FOUR') NOT NULL,
    `ekidenRangeId` INTEGER NULL,
    `ekiden_itemId` INTEGER NOT NULL,
    `studentId` INTEGER NOT NULL,

    INDEX `student_ekiden_item_ekiden_itemId_idx`(`ekiden_itemId`),
    INDEX `student_ekiden_item_studentId_idx`(`studentId`),
    UNIQUE INDEX `student_ekiden_item_ekiden_itemId_studentId_key`(`ekiden_itemId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ekiden_no_team` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `schoolId` INTEGER NOT NULL,
    `ekiden_itemId` INTEGER NOT NULL,
    `coach` VARCHAR(191) NOT NULL,
    `leader` VARCHAR(191) NOT NULL,

    INDEX `Ekiden_no_team_schoolId_idx`(`schoolId`),
    INDEX `Ekiden_no_team_ekiden_itemId_idx`(`ekiden_itemId`),
    UNIQUE INDEX `Ekiden_no_team_schoolId_ekiden_itemId_key`(`schoolId`, `ekiden_itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ekiden_Team_Predict` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `Ekiden_no_teamId` INTEGER NOT NULL,
    `Ekiden_itemId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ekiden_th_interval` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `Ekiden_itemId` INTEGER NOT NULL,
    `ekiden_rangeId` INTEGER NOT NULL,
    `ekiden_Student_Interval_id` INTEGER NOT NULL,

    UNIQUE INDEX `Ekiden_th_interval_ekiden_Student_Interval_id_key`(`ekiden_Student_Interval_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ekiden_Student_Interval` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ekiden_range` ADD CONSTRAINT `ekiden_range_ekidenId_fkey` FOREIGN KEY (`ekidenId`) REFERENCES `ekiden`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Ekiden_no_team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ekiden_item` ADD CONSTRAINT `Ekiden_item_ekidenId_fkey` FOREIGN KEY (`ekidenId`) REFERENCES `ekiden`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_ekiden_item` ADD CONSTRAINT `student_ekiden_item_ekidenRangeId_fkey` FOREIGN KEY (`ekidenRangeId`) REFERENCES `ekiden_range`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_ekiden_item` ADD CONSTRAINT `student_ekiden_item_ekiden_itemId_fkey` FOREIGN KEY (`ekiden_itemId`) REFERENCES `Ekiden_item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_ekiden_item` ADD CONSTRAINT `student_ekiden_item_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ekiden_no_team` ADD CONSTRAINT `Ekiden_no_team_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ekiden_no_team` ADD CONSTRAINT `Ekiden_no_team_ekiden_itemId_fkey` FOREIGN KEY (`ekiden_itemId`) REFERENCES `Ekiden_item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ekiden_Team_Predict` ADD CONSTRAINT `Ekiden_Team_Predict_Ekiden_no_teamId_fkey` FOREIGN KEY (`Ekiden_no_teamId`) REFERENCES `Ekiden_no_team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ekiden_Team_Predict` ADD CONSTRAINT `Ekiden_Team_Predict_Ekiden_itemId_fkey` FOREIGN KEY (`Ekiden_itemId`) REFERENCES `Ekiden_item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ekiden_th_interval` ADD CONSTRAINT `Ekiden_th_interval_Ekiden_itemId_fkey` FOREIGN KEY (`Ekiden_itemId`) REFERENCES `Ekiden_item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ekiden_th_interval` ADD CONSTRAINT `Ekiden_th_interval_ekiden_rangeId_fkey` FOREIGN KEY (`ekiden_rangeId`) REFERENCES `ekiden_range`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ekiden_th_interval` ADD CONSTRAINT `Ekiden_th_interval_ekiden_Student_Interval_id_fkey` FOREIGN KEY (`ekiden_Student_Interval_id`) REFERENCES `Ekiden_Student_Interval`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ekiden_Student_Interval` ADD CONSTRAINT `Ekiden_Student_Interval_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
