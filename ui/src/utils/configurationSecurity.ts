/**
 * Configuration Security & Encryption System
 * Phase 7.4.5 - Security utilities for protecting sensitive configuration data
 */

import type {
  SecurityConfiguration,
  EncryptionSettings,
  AccessControlSettings,
  AuditLoggingSettings,
  SecretsManagementSettings,
  ComplianceSettings,
  EncryptionAlgorithm,
  KeyDerivationFunction
} from '../types/configurationImportExport';
import type { SystemConfiguration } from '../types/configuration';

// =============================================================================
// Encryption and Decryption Utilities
// =============================================================================

export class ConfigurationEncryption {
  private static readonly DEFAULT_ALGORITHM: EncryptionAlgorithm = 'aes-256-gcm';
  private static readonly DEFAULT_KEY_DERIVATION: KeyDerivationFunction = 'pbkdf2';
  private static readonly DEFAULT_ITERATIONS = 100000;
  private static readonly DEFAULT_SALT_LENGTH = 32;
  private static readonly DEFAULT_KEY_SIZE = 256;

  /**
   * Encrypt sensitive configuration fields
   */
  static async encryptConfiguration(
    config: SystemConfiguration,
    masterPassword: string,
    settings: EncryptionSettings
  ): Promise<{ encryptedConfig: SystemConfiguration; encryptionMetadata: EncryptionMetadata }> {
    try {
      const encryptedConfig = structuredClone(config); // Deep clone
      const iterations = settings.iterationCount || this.DEFAULT_ITERATIONS;
      const saltLength = settings.saltLength || this.DEFAULT_SALT_LENGTH;
      
      // Generate salt for key derivation
      const salt = crypto.getRandomValues(new Uint8Array(saltLength));
      const saltBase64 = btoa(String.fromCharCode(...salt));
      
      const encryptionMetadata: EncryptionMetadata = {
        algorithm: settings.algorithm,
        keyDerivation: settings.keyDerivation,
        encryptedFields: [],
        salt: saltBase64,
        iterations,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      if (!settings.enabled) {
        return { encryptedConfig, encryptionMetadata };
      }

      // Generate master key from password using stored salt
      const masterKey = await this.deriveMasterKey(
        masterPassword,
        settings.keyDerivation,
        iterations,
        salt
      );

      // Encrypt specified fields
      const fieldsToEncrypt = settings.encryptSensitiveFields
        ? (settings.encryptionFields.length > 0 
          ? settings.encryptionFields 
          : this.getDefaultSensitiveFields())
        : settings.encryptionFields;

      for (const fieldPath of fieldsToEncrypt) {
        const value = this.getNestedValue(encryptedConfig, fieldPath);
        if (value !== undefined && typeof value === 'string') {
          const encryptedValue = await this.encryptValue(value, masterKey, settings.algorithm);
          this.setNestedValue(encryptedConfig, fieldPath, encryptedValue);
          encryptionMetadata.encryptedFields.push(fieldPath);
        }
      }

      return { encryptedConfig, encryptionMetadata };
    } catch (error: any) {
      throw new Error(`Configuration encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt sensitive configuration fields
   */
  static async decryptConfiguration(
    encryptedConfig: SystemConfiguration,
    masterPassword: string,
    encryptionMetadata: EncryptionMetadata
  ): Promise<SystemConfiguration> {
    try {
      const decryptedConfig = structuredClone(encryptedConfig); // Deep clone

      if (encryptionMetadata.encryptedFields.length === 0) {
        return decryptedConfig;
      }

      // Decode salt from metadata
      const salt = new Uint8Array(
        atob(encryptionMetadata.salt).split('').map(char => char.charCodeAt(0))
      );

      // Generate master key from password using stored salt
      const masterKey = await this.deriveMasterKey(
        masterPassword,
        encryptionMetadata.keyDerivation,
        encryptionMetadata.iterations,
        salt
      );

      // Decrypt fields
      for (const fieldPath of encryptionMetadata.encryptedFields) {
        const encryptedValue = this.getNestedValue(decryptedConfig, fieldPath);
        if (encryptedValue && typeof encryptedValue === 'string') {
          const decryptedValue = await this.decryptValue(encryptedValue, masterKey, encryptionMetadata.algorithm);
          this.setNestedValue(decryptedConfig, fieldPath, decryptedValue);
        }
      }

      return decryptedConfig;
    } catch (error: any) {
      throw new Error(`Configuration decryption failed: ${error.message}`);
    }
  }

  /**
   * Derive master key from password using specified KDF
   */
  private static async deriveMasterKey(
    password: string,
    kdf: KeyDerivationFunction,
    iterations: number,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    switch (kdf) {
      case 'pbkdf2':
        return await this.deriveKeyPBKDF2(passwordBuffer, salt, iterations);
      case 'scrypt':
        // Note: scrypt is not natively supported in Web Crypto API
        // In real implementation, use a library like scrypt-js
        throw new Error('scrypt not implemented - use a proper scrypt library');
      case 'argon2id':
        // Note: Argon2 is not natively supported in Web Crypto API
        // In real implementation, use a library like argon2-browser
        throw new Error('argon2id not implemented - use a proper argon2 library');
      default:
        throw new Error(`Unsupported key derivation function: ${kdf}`);
    }
  }

  private static async deriveKeyPBKDF2(
    password: ArrayBuffer,
    salt: Uint8Array,
    iterations: number
  ): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      password,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: this.DEFAULT_KEY_SIZE },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt a single value
   */
  private static async encryptValue(
    value: string,
    key: CryptoKey,
    algorithm: EncryptionAlgorithm
  ): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    
    switch (algorithm) {
      case 'aes-256-gcm':
        return await this.encryptAESGCM(data, key);
      case 'aes-256-cbc':
        return await this.encryptAESCBC(data, key);
      case 'chacha20-poly1305':
        // Note: ChaCha20-Poly1305 is not widely supported in Web Crypto API
        throw new Error('chacha20-poly1305 not implemented - use a proper library');
      default:
        throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
    }
  }

  /**
   * Decrypt a single value
   */
  private static async decryptValue(
    encryptedValue: string,
    key: CryptoKey,
    algorithm: EncryptionAlgorithm
  ): Promise<string> {
    switch (algorithm) {
      case 'aes-256-gcm':
        return await this.decryptAESGCM(encryptedValue, key);
      case 'aes-256-cbc':
        return await this.decryptAESCBC(encryptedValue, key);
      case 'chacha20-poly1305':
        throw new Error('chacha20-poly1305 not implemented - use a proper library');
      default:
        throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
    }
  }

  private static async encryptAESGCM(data: Uint8Array, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Return base64 encoded result
    return btoa(String.fromCharCode(...combined));
  }

  private static async decryptAESGCM(encryptedValue: string, key: CryptoKey): Promise<string> {
    // Decode base64
    const combined = new Uint8Array(
      atob(encryptedValue).split('').map(char => char.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  private static async encryptAESCBC(data: Uint8Array, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    
    // Pad data to 16-byte boundary
    const paddedData = this.addPKCS7Padding(data, 16);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: iv },
      key,
      paddedData
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  private static async decryptAESCBC(encryptedValue: string, key: CryptoKey): Promise<string> {
    const combined = new Uint8Array(
      atob(encryptedValue).split('').map(char => char.charCodeAt(0))
    );

    const iv = combined.slice(0, 16);
    const encrypted = combined.slice(16);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv },
      key,
      encrypted
    );

    // Remove PKCS7 padding
    const unpaddedData = this.removePKCS7Padding(new Uint8Array(decrypted));
    
    const decoder = new TextDecoder();
    return decoder.decode(unpaddedData);
  }

  private static addPKCS7Padding(data: Uint8Array, blockSize: number): Uint8Array {
    const padding = blockSize - (data.length % blockSize);
    const padded = new Uint8Array(data.length + padding);
    padded.set(data, 0);
    for (let i = data.length; i < padded.length; i++) {
      padded[i] = padding;
    }
    return padded;
  }

  private static removePKCS7Padding(data: Uint8Array): Uint8Array {
    const padding = data[data.length - 1];
    return data.slice(0, data.length - padding);
  }

  private static getDefaultSensitiveFields(): string[] {
    return [
      'services.neo4j.password',
      'services.qdrant.apiKey',
      'api.authentication.settings.secretKey',
      'security.headers.contentSecurityPolicy'
    ];
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private static setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}

interface EncryptionMetadata {
  algorithm: EncryptionAlgorithm;
  keyDerivation: KeyDerivationFunction;
  encryptedFields: string[];
  salt: string; // Base64 encoded salt
  iterations: number;
  timestamp: string;
  version: string;
}

// =============================================================================
// Access Control System
// =============================================================================

export class ConfigurationAccessControl {
  private static sessions: Map<string, UserSession> = new Map();
  private static accessLog: AccessLogEntry[] = [];

  /**
   * Authenticate user for configuration access
   */
  static async authenticateUser(
    username: string,
    password: string,
    settings: AccessControlSettings
  ): Promise<AuthenticationResult> {
    try {
      if (!settings.enabled) {
        return {
          success: true,
          sessionToken: this.generateSessionToken(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          permissions: ['read', 'write', 'admin'],
          message: 'Access control disabled'
        };
      }

      // Check if user is locked out
      const lockoutStatus = this.checkLockoutStatus(username, settings);
      if (lockoutStatus.lockedOut) {
        this.logAccess(username, 'authentication', false, 'User locked out');
        return {
          success: false,
          message: `Account locked out. Try again after ${lockoutStatus.remainingTime} minutes.`,
          lockedOut: true,
          lockoutRemainingTime: lockoutStatus.remainingTime
        };
      }

      // Simulate password verification (in real implementation, use proper hashing)
      const isValidUser = this.verifyUserCredentials(username, password, settings);
      
      if (!isValidUser) {
        this.recordFailedAttempt(username);
        this.logAccess(username, 'authentication', false, 'Invalid credentials');
        return {
          success: false,
          message: 'Invalid username or password',
          attemptsRemaining: settings.maxFailedAttempts - this.getFailedAttempts(username)
        };
      }

      // Clear failed attempts on successful login
      this.clearFailedAttempts(username);
      
      // Generate session
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + settings.sessionTimeout).toISOString();
      const permissions = this.getUserPermissions(username, settings);

      // Store session
      this.sessions.set(sessionToken, {
        username,
        permissions,
        createdAt: new Date().toISOString(),
        expiresAt,
        lastActivity: new Date().toISOString()
      });

      this.logAccess(username, 'authentication', true, 'Login successful');

      return {
        success: true,
        sessionToken,
        expiresAt,
        permissions,
        message: 'Authentication successful'
      };
    } catch (error: any) {
      this.logAccess(username, 'authentication', false, `Authentication error: ${error.message}`);
      return {
        success: false,
        message: 'Authentication failed'
      };
    }
  }

  /**
   * Validate session token
   */
  static validateSession(sessionToken: string): SessionValidationResult {
    const session = this.sessions.get(sessionToken);
    
    if (!session) {
      return {
        valid: false,
        reason: 'Session not found'
      };
    }

    const now = new Date();
    const expiresAt = new Date(session.expiresAt);

    if (now > expiresAt) {
      this.sessions.delete(sessionToken);
      return {
        valid: false,
        reason: 'Session expired'
      };
    }

    // Update last activity
    session.lastActivity = now.toISOString();
    this.sessions.set(sessionToken, session);

    return {
      valid: true,
      session
    };
  }

  /**
   * Check if user has required permission
   */
  static hasPermission(
    sessionToken: string,
    requiredPermission: Permission,
    resource?: string
  ): PermissionCheckResult {
    const sessionValidation = this.validateSession(sessionToken);
    
    if (!sessionValidation.valid) {
      return {
        hasPermission: false,
        reason: sessionValidation.reason
      };
    }

    const session = sessionValidation.session!;
    const hasPermission = session.permissions.includes(requiredPermission) || 
                         session.permissions.includes('admin');

    this.logAccess(
      session.username,
      'permission_check',
      hasPermission,
      `Checked ${requiredPermission} permission for ${resource || 'general'}`
    );

    return {
      hasPermission,
      reason: hasPermission ? 'Permission granted' : 'Insufficient permissions'
    };
  }

  /**
   * Logout user session
   */
  static logout(sessionToken: string): void {
    const session = this.sessions.get(sessionToken);
    if (session) {
      this.logAccess(session.username, 'logout', true, 'User logged out');
      this.sessions.delete(sessionToken);
    }
  }

  private static verifyUserCredentials(
    username: string,
    password: string,
    settings: AccessControlSettings
  ): boolean {
    // Simplified verification - in real implementation, use proper password hashing
    const allowedUsers = [
      ...settings.allowedUsers,
      ...settings.adminUsers,
      ...settings.readOnlyUsers
    ];
    
    return allowedUsers.includes(username) && password.length >= 8;
  }

  private static getUserPermissions(username: string, settings: AccessControlSettings): Permission[] {
    if (settings.adminUsers.includes(username)) {
      return ['read', 'write', 'admin', 'export', 'import'];
    } else if (settings.readOnlyUsers.includes(username)) {
      return ['read'];
    } else if (settings.allowedUsers.includes(username)) {
      return ['read', 'write'];
    }
    return [];
  }

  private static generateSessionToken(): string {
    // Generate 32 random bytes for the session token
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    // Convert to base64 directly from raw bytes for better entropy
    return btoa(String.fromCharCode(...randomBytes));
  }

  private static failedAttempts: Map<string, FailedAttemptRecord> = new Map();

  private static recordFailedAttempt(username: string): void {
    const now = Date.now();
    const existing = this.failedAttempts.get(username);
    
    if (existing) {
      existing.count++;
      existing.lastAttempt = now;
    } else {
      this.failedAttempts.set(username, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
    }
  }

  private static getFailedAttempts(username: string): number {
    return this.failedAttempts.get(username)?.count || 0;
  }

  private static clearFailedAttempts(username: string): void {
    this.failedAttempts.delete(username);
  }

  private static checkLockoutStatus(username: string, settings: AccessControlSettings): LockoutStatus {
    const record = this.failedAttempts.get(username);
    
    if (!record || record.count < settings.maxFailedAttempts) {
      return { lockedOut: false, remainingTime: 0 };
    }

    const lockoutEnd = record.lastAttempt + settings.lockoutDuration;
    const now = Date.now();

    if (now < lockoutEnd) {
      const remainingTime = Math.ceil((lockoutEnd - now) / (1000 * 60));
      return { lockedOut: true, remainingTime };
    }

    // Lockout period has expired
    this.clearFailedAttempts(username);
    return { lockedOut: false, remainingTime: 0 };
  }

  private static logAccess(
    username: string,
    action: string,
    success: boolean,
    details: string
  ): void {
    const logEntry: AccessLogEntry = {
      timestamp: new Date().toISOString(),
      username,
      action,
      success,
      details,
      ipAddress: 'unknown', // Would be actual IP in real implementation
      userAgent: navigator.userAgent
    };

    this.accessLog.push(logEntry);
    
    // Keep only last 1000 entries
    if (this.accessLog.length > 1000) {
      this.accessLog.shift();
    }
  }

  /**
   * Get access log for audit purposes
   */
  static getAccessLog(limit: number = 100): AccessLogEntry[] {
    return this.accessLog.slice(-limit);
  }
}

// Type definitions for access control
type Permission = 'read' | 'write' | 'admin' | 'export' | 'import';

interface UserSession {
  username: string;
  permissions: Permission[];
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
}

interface AuthenticationResult {
  success: boolean;
  sessionToken?: string;
  expiresAt?: string;
  permissions?: Permission[];
  message: string;
  lockedOut?: boolean;
  lockoutRemainingTime?: number;
  attemptsRemaining?: number;
}

interface SessionValidationResult {
  valid: boolean;
  session?: UserSession;
  reason?: string;
}

interface PermissionCheckResult {
  hasPermission: boolean;
  reason: string;
}

interface FailedAttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

interface LockoutStatus {
  lockedOut: boolean;
  remainingTime: number;
}

interface AccessLogEntry {
  timestamp: string;
  username: string;
  action: string;
  success: boolean;
  details: string;
  ipAddress: string;
  userAgent: string;
}

// =============================================================================
// Audit Logging System
// =============================================================================

export class ConfigurationAuditLogger {
  private static auditLog: AuditLogEntry[] = [];
  private static settings: AuditLoggingSettings = {
    enabled: true,
    logLevel: 'standard',
    logConfigChanges: true,
    logAccess: true,
    logAuthentication: true,
    logExportImport: true,
    retentionDays: 365,
    logFormat: 'json',
    destination: 'file'
  };

  /**
   * Configure audit logging
   */
  static configure(settings: AuditLoggingSettings): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Log configuration change
   */
  static logConfigurationChange(
    username: string,
    changes: ConfigurationChangeEvent[],
    metadata?: Record<string, any>
  ): void {
    if (!this.settings.enabled || !this.settings.logConfigChanges) {
      return;
    }

    const logEntry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      type: 'configuration_change',
      severity: 'info',
      username,
      action: 'modify_configuration',
      resource: 'system_configuration',
      details: {
        changes,
        changeCount: changes.length,
        metadata
      },
      ipAddress: 'unknown',
      userAgent: navigator.userAgent,
      sessionId: 'unknown' // Would be actual session ID in real implementation
    };

    this.addLogEntry(logEntry);
  }

  /**
   * Log export/import operations
   */
  static logExportImport(
    username: string,
    operation: 'export' | 'import',
    format: string,
    success: boolean,
    details?: Record<string, any>
  ): void {
    if (!this.settings.enabled || !this.settings.logExportImport) {
      return;
    }

    const logEntry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      type: 'export_import',
      severity: success ? 'info' : 'warning',
      username,
      action: operation,
      resource: 'configuration_data',
      details: {
        format,
        success,
        ...details
      },
      ipAddress: 'unknown',
      userAgent: navigator.userAgent,
      sessionId: 'unknown'
    };

    this.addLogEntry(logEntry);
  }

  /**
   * Log security events
   */
  static logSecurityEvent(
    username: string,
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>
  ): void {
    if (!this.settings.enabled) {
      return;
    }

    const logEntry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      type: 'security_event',
      severity,
      username,
      action: eventType,
      resource: 'security_system',
      details,
      ipAddress: 'unknown',
      userAgent: navigator.userAgent,
      sessionId: 'unknown'
    };

    this.addLogEntry(logEntry);
  }

  /**
   * Get audit log with filtering
   */
  static getAuditLog(filter?: AuditLogFilter): AuditLogEntry[] {
    let filteredLog = [...this.auditLog];

    if (filter) {
      if (filter.startDate) {
        const startDate = new Date(filter.startDate);
        filteredLog = filteredLog.filter(entry => new Date(entry.timestamp) >= startDate);
      }

      if (filter.endDate) {
        const endDate = new Date(filter.endDate);
        filteredLog = filteredLog.filter(entry => new Date(entry.timestamp) <= endDate);
      }

      if (filter.username) {
        filteredLog = filteredLog.filter(entry => entry.username === filter.username);
      }

      if (filter.type) {
        filteredLog = filteredLog.filter(entry => entry.type === filter.type);
      }

      if (filter.severity) {
        filteredLog = filteredLog.filter(entry => entry.severity === filter.severity);
      }

      if (filter.action) {
        filteredLog = filteredLog.filter(entry => entry.action.includes(filter.action));
      }
    }

    // Apply limit
    const limit = filter?.limit || 100;
    return filteredLog.slice(-limit);
  }

  /**
   * Export audit log
   */
  static exportAuditLog(format: 'json' | 'csv' = 'json'): string {
    const logData = this.auditLog;

    if (format === 'csv') {
      const headers = 'Timestamp,Type,Severity,Username,Action,Resource,Details\n';
      const rows = logData.map(entry => 
        `${entry.timestamp},${entry.type},${entry.severity},${entry.username},${entry.action},${entry.resource},"${JSON.stringify(entry.details).replace(/"/g, '""')}"`
      ).join('\n');
      return headers + rows;
    }

    return JSON.stringify(logData, null, 2);
  }

  private static addLogEntry(entry: AuditLogEntry): void {
    this.auditLog.push(entry);

    // Cleanup old entries based on retention policy
    const retentionMs = this.settings.retentionDays * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - retentionMs);
    
    this.auditLog = this.auditLog.filter(logEntry => 
      new Date(logEntry.timestamp) > cutoffDate
    );

    // Also limit total entries to prevent memory issues
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }
  }

  private static generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  type: 'configuration_change' | 'export_import' | 'security_event' | 'access' | 'authentication';
  severity: 'info' | 'warning' | 'error' | 'critical' | 'low' | 'medium' | 'high';
  username: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
}

interface ConfigurationChangeEvent {
  field: string;
  operation: 'add' | 'update' | 'delete';
  oldValue?: any;
  newValue?: any;
  path: string;
}

interface AuditLogFilter {
  startDate?: string;
  endDate?: string;
  username?: string;
  type?: string;
  severity?: string;
  action?: string;
  limit?: number;
}

// =============================================================================
// Security Validation System
// =============================================================================

export class ConfigurationSecurityValidator {
  /**
   * Validate configuration for security issues
   */
  static validateSecurity(config: SystemConfiguration): SecurityValidationResult {
    const issues: SecurityIssue[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check HTTPS configuration
    if (!config.security?.https?.enabled) {
      issues.push({
        severity: 'high',
        category: 'encryption',
        description: 'HTTPS is not enabled',
        field: 'security.https.enabled',
        recommendation: 'Enable HTTPS for secure data transmission'
      });
      score -= 25;
    }

    // Check authentication
    if (!config.api?.authentication?.enabled) {
      issues.push({
        severity: 'critical',
        category: 'authentication',
        description: 'API authentication is disabled',
        field: 'api.authentication.enabled',
        recommendation: 'Enable API authentication to secure endpoints'
      });
      score -= 30;
    }

    // Check for default passwords
    const defaultPasswords = ['password', 'admin', 'contextmemory'];
    if (config.services?.neo4j?.password && defaultPasswords.includes(config.services.neo4j.password.toLowerCase())) {
      issues.push({
        severity: 'critical',
        category: 'credentials',
        description: 'Default password detected for Neo4j',
        field: 'services.neo4j.password',
        recommendation: 'Change default password to a strong, unique password'
      });
      score -= 35;
    }

    // Check CORS configuration
    if (config.api?.cors?.enabled && config.api.cors.origins?.includes('*')) {
      issues.push({
        severity: 'medium',
        category: 'cors',
        description: 'CORS allows all origins (*)',
        field: 'api.cors.origins',
        recommendation: 'Specify explicit CORS origins instead of wildcard'
      });
      score -= 15;
    }

    // Check security headers
    if (!config.security?.headers?.contentSecurityPolicy) {
      issues.push({
        severity: 'medium',
        category: 'headers',
        description: 'Content Security Policy not configured',
        field: 'security.headers.contentSecurityPolicy',
        recommendation: 'Configure CSP header to prevent XSS attacks'
      });
      score -= 10;
    }

    // Check rate limiting
    if (!config.api?.rateLimiting?.enabled) {
      issues.push({
        severity: 'medium',
        category: 'rate_limiting',
        description: 'Rate limiting is disabled',
        field: 'api.rateLimiting.enabled',
        recommendation: 'Enable rate limiting to prevent abuse'
      });
      score -= 10;
    }

    // Generate recommendations
    if (issues.length === 0) {
      recommendations.push('Configuration security is good');
    } else {
      recommendations.push(...issues.map(issue => issue.recommendation));
    }

    return {
      score: Math.max(0, score),
      grade: this.getSecurityGrade(score),
      issues,
      recommendations,
      compliant: issues.filter(i => i.severity === 'critical').length === 0
    };
  }

  private static getSecurityGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}

interface SecurityValidationResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: SecurityIssue[];
  recommendations: string[];
  compliant: boolean;
}

interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  field: string;
  recommendation: string;
}

// Export all utilities
export default {
  ConfigurationEncryption,
  ConfigurationAccessControl,
  ConfigurationAuditLogger,
  ConfigurationSecurityValidator
};