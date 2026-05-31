-- AlterTable
ALTER TABLE `Character` ADD COLUMN `armorClass` INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE `InventoryItem` (
    `id` VARCHAR(191) NOT NULL,
    `characterId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `type` ENUM('WEAPON', 'ARMOR', 'POTION', 'TOOL', 'TREASURE', 'DOCUMENT', 'MAGIC', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `rarity` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY') NOT NULL DEFAULT 'COMMON',
    `isEquipped` BOOLEAN NOT NULL DEFAULT false,
    `weight` DOUBLE NULL,
    `value` INTEGER NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `InventoryItem_characterId_idx`(`characterId`),
    INDEX `InventoryItem_createdById_idx`(`createdById`),
    INDEX `InventoryItem_type_idx`(`type`),
    INDEX `InventoryItem_rarity_idx`(`rarity`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Combat` (
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'FINISHED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `currentTurnIndex` INTEGER NOT NULL DEFAULT 0,
    `round` INTEGER NOT NULL DEFAULT 1,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Combat_campaignId_idx`(`campaignId`),
    INDEX `Combat_createdById_idx`(`createdById`),
    INDEX `Combat_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CombatParticipant` (
    `id` VARCHAR(191) NOT NULL,
    `combatId` VARCHAR(191) NOT NULL,
    `characterId` VARCHAR(191) NULL,
    `enemyId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('CHARACTER', 'ENEMY') NOT NULL,
    `initiative` INTEGER NOT NULL,
    `turnOrder` INTEGER NOT NULL,
    `maxHp` INTEGER NOT NULL,
    `currentHp` INTEGER NOT NULL,
    `armorClass` INTEGER NOT NULL,
    `isDefeated` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CombatParticipant_combatId_idx`(`combatId`),
    INDEX `CombatParticipant_characterId_idx`(`characterId`),
    INDEX `CombatParticipant_enemyId_idx`(`enemyId`),
    INDEX `CombatParticipant_turnOrder_idx`(`turnOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InventoryItem` ADD CONSTRAINT `InventoryItem_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryItem` ADD CONSTRAINT `InventoryItem_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Combat` ADD CONSTRAINT `Combat_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `Campaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Combat` ADD CONSTRAINT `Combat_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CombatParticipant` ADD CONSTRAINT `CombatParticipant_combatId_fkey` FOREIGN KEY (`combatId`) REFERENCES `Combat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CombatParticipant` ADD CONSTRAINT `CombatParticipant_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CombatParticipant` ADD CONSTRAINT `CombatParticipant_enemyId_fkey` FOREIGN KEY (`enemyId`) REFERENCES `Enemy`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
