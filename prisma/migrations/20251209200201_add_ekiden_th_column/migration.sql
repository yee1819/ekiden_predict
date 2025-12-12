/*
  Warnings:

  - Added the required column `ekiden_th` to the `Ekiden_th` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ekiden_th` ADD COLUMN `ekiden_th` INTEGER NOT NULL;
