-- Database Schema for Sparepart Flow App
-- Created: 2025-12-23
-- Migration from Firebase Firestore to MySQL

CREATE DATABASE IF NOT EXISTS sparepart_flow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sparepart_flow;

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    users VARCHAR(255) NOT NULL,
    nik VARCHAR(50) NOT NULL UNIQUE,
    nama_teknisi VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    role ENUM('Admin', 'Teknisi', 'Manager', 'Viewer') NOT NULL DEFAULT 'Viewer',
    photo TEXT,
    
    -- Permissions (stored as JSON)
    permissions JSON NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_nik (nik),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: inventory
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(255) PRIMARY KEY,
    part VARCHAR(255) NOT NULL,
    deskripsi TEXT NOT NULL,
    harga_dpp DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    ppn DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_harga DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    satuan VARCHAR(50) NOT NULL,
    available_qty INT NOT NULL DEFAULT 0,
    qty_baik INT NOT NULL DEFAULT 0,
    qty_rusak INT NOT NULL DEFAULT 0,
    lokasi VARCHAR(255) NOT NULL,
    return_to_factory ENUM('YES', 'NO') NOT NULL DEFAULT 'NO',
    qty_real INT NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_part (part),
    INDEX idx_lokasi (lokasi),
    INDEX idx_available_qty (available_qty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: daily_bon
CREATE TABLE IF NOT EXISTS daily_bon (
    id VARCHAR(255) PRIMARY KEY,
    part VARCHAR(255) NOT NULL,
    deskripsi TEXT NOT NULL,
    qty_dailybon INT NOT NULL DEFAULT 0,
    harga DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    status_bon ENUM('BON', 'RECEIVED', 'KMP', 'CANCELED') NOT NULL DEFAULT 'BON',
    teknisi VARCHAR(255) NOT NULL,
    tanggal_dailybon DATE NOT NULL,
    no_tkl VARCHAR(100) NOT NULL,
    keterangan TEXT,
    stock_updated BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_part (part),
    INDEX idx_teknisi (teknisi),
    INDEX idx_status (status_bon),
    INDEX idx_tanggal (tanggal_dailybon),
    INDEX idx_no_tkl (no_tkl),
    
    FOREIGN KEY (part) REFERENCES inventory(part) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: bon_pds
CREATE TABLE IF NOT EXISTS bon_pds (
    id VARCHAR(255) PRIMARY KEY,
    part VARCHAR(255) NOT NULL,
    deskripsi TEXT NOT NULL,
    qty_bonpds INT NOT NULL DEFAULT 0,
    status_bonpds ENUM('BON', 'RECEIVED', 'CANCELED') NOT NULL DEFAULT 'BON',
    site_bonpds VARCHAR(255) NOT NULL,
    tanggal_bonpds DATE NOT NULL,
    no_transaksi VARCHAR(100) NOT NULL,
    keterangan TEXT,
    stock_updated BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_part (part),
    INDEX idx_site (site_bonpds),
    INDEX idx_status (status_bonpds),
    INDEX idx_tanggal (tanggal_bonpds),
    INDEX idx_no_transaksi (no_transaksi),
    
    FOREIGN KEY (part) REFERENCES inventory(part) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: msk
CREATE TABLE IF NOT EXISTS msk (
    id VARCHAR(255) PRIMARY KEY,
    part VARCHAR(255) NOT NULL,
    deskripsi TEXT NOT NULL,
    qty_msk INT NOT NULL DEFAULT 0,
    status_msk ENUM('BON', 'RECEIVED', 'CANCELED') NOT NULL DEFAULT 'BON',
    site_msk VARCHAR(255) NOT NULL,
    tanggal_msk DATE NOT NULL,
    no_transaksi VARCHAR(100) NOT NULL,
    keterangan TEXT,
    stock_updated BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_part (part),
    INDEX idx_site (site_msk),
    INDEX idx_status (status_msk),
    INDEX idx_tanggal (tanggal_msk),
    INDEX idx_no_transaksi (no_transaksi),
    
    FOREIGN KEY (part) REFERENCES inventory(part) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Placeholder tables for future entities
CREATE TABLE IF NOT EXISTS nr (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tsn (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tsp (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sob (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
