-- =============================================
-- BASE DE DATOS: PsicoAgenda (PostgreSQL compatible con Google Cloud SQL)
-- Instituto Tecnológico de Tepic - ISC
-- =============================================


-- =============================================
-- CREAR TABLAS
-- =============================================

-- RF_US_001, RF_US_004, RF_US_017, RF_US_022
CREATE TABLE Usuarios (
  UsuarioID         SERIAL PRIMARY KEY,
  Nombre            VARCHAR(100)  NOT NULL,
  ApellidoPaterno   VARCHAR(100)  NOT NULL,
  ApellidoMaterno   VARCHAR(100),
  Correo            VARCHAR(150)  NOT NULL UNIQUE,
  ContrasenaHash    VARCHAR(256)  NOT NULL,
  Telefono          VARCHAR(15),
  Rol               VARCHAR(20)   NOT NULL CHECK (Rol IN ('paciente', 'psicologa', 'admin')),
  FotoPerfil        VARCHAR(500),
  Activo            BOOLEAN       NOT NULL DEFAULT TRUE,
  FechaRegistro     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  TokenRecuperacion VARCHAR(256),
  TokenExpiracion   TIMESTAMP
);

-- RF_US_008, RF_US_009, RF_US_015
CREATE TABLE Psicologas (
  PsicologaID        SERIAL PRIMARY KEY,
  UsuarioID          INTEGER NOT NULL UNIQUE,
  CedulaProfesional  VARCHAR(20)  NOT NULL UNIQUE,
  Especialidad       VARCHAR(150) NOT NULL,
  Descripcion        VARCHAR(500),
  Consultorio        VARCHAR(200),
  FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID)
);

-- RF_US_003, RF_US_004, RF_US_006
CREATE TABLE Pacientes (
  PacienteID          SERIAL PRIMARY KEY,
  UsuarioID           INTEGER NOT NULL UNIQUE,
  FechaNacimiento     DATE,
  Genero              VARCHAR(20) CHECK (Genero IN ('Masculino', 'Femenino', 'Otro', 'Prefiero no decir')),
  Direccion           VARCHAR(300),
  MotivoConsulta      VARCHAR(500),
  ContactoEmergencia  VARCHAR(100),
  TelEmergencia       VARCHAR(15),
  FechaAlta           DATE DEFAULT CURRENT_DATE,
  FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID)
);

-- RF_US_012
CREATE TABLE Agendas (
  AgendaID     SERIAL PRIMARY KEY,
  PsicologaID  INTEGER NOT NULL,
  DiaSemana    VARCHAR(15) NOT NULL CHECK (DiaSemana IN ('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo')),
  HoraInicio   TIME NOT NULL,
  HoraFin      TIME NOT NULL,
  Disponible   BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (PsicologaID) REFERENCES Psicologas(PsicologaID),
  CHECK (HoraFin > HoraInicio)
);

-- RF_US_002, RF_US_008, RF_US_009, RF_US_010, RF_US_011, RF_US_013, RF_US_014, RF_US_019
CREATE TABLE Citas (
  CitaID             SERIAL PRIMARY KEY,
  PacienteID         INTEGER NOT NULL,
  PsicologaID        INTEGER NOT NULL,
  FechaHora          TIMESTAMP     NOT NULL,
  DuracionMin        INTEGER       NOT NULL DEFAULT 60 CHECK (DuracionMin > 0),
  Estado             VARCHAR(20)   NOT NULL DEFAULT 'Pendiente' CHECK (Estado IN ('Pendiente','Confirmada','Cancelada','Completada','Reagendada')),
  Modalidad          VARCHAR(20)   NOT NULL DEFAULT 'Presencial' CHECK (Modalidad IN ('Presencial','En linea')),
  NotasPaciente      VARCHAR(500),
  NotasPsicologa     VARCHAR(500),
  FechaCreacion      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FechaModificacion  TIMESTAMP,
  FOREIGN KEY (PacienteID) REFERENCES Pacientes(PacienteID),
  FOREIGN KEY (PsicologaID) REFERENCES Psicologas(PsicologaID),
  UNIQUE (PsicologaID, FechaHora)
);

-- RF_US_014
CREATE TABLE SolicitudesReagenda (
  SolicitudID      SERIAL PRIMARY KEY,
  CitaID           INTEGER NOT NULL,
  NuevaFechaHora   TIMESTAMP     NOT NULL,
  Motivo           VARCHAR(300),
  EstadoSolicitud  VARCHAR(20)   NOT NULL DEFAULT 'Pendiente' CHECK (EstadoSolicitud IN ('Pendiente','Aprobada','Rechazada')),
  FechaSolicitud   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (CitaID) REFERENCES Citas(CitaID)
);

-- RF_US_005, RF_US_023, RF_US_024
CREATE TABLE HistorialClinico (
  HistorialID    SERIAL PRIMARY KEY,
  PacienteID     INTEGER NOT NULL,
  CitaID         INTEGER,
  PsicologaID    INTEGER NOT NULL,
  FechaEntrada   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  Diagnostico    VARCHAR(300),
  Tratamiento    VARCHAR(500),
  Observaciones  TEXT,
  EsConfidencial BOOLEAN       NOT NULL DEFAULT TRUE,
  FOREIGN KEY (PacienteID) REFERENCES Pacientes(PacienteID),
  FOREIGN KEY (CitaID) REFERENCES Citas(CitaID),
  FOREIGN KEY (PsicologaID) REFERENCES Psicologas(PsicologaID)
);

-- RF_US_020
CREATE TABLE Notificaciones (
  NotificacionID  SERIAL PRIMARY KEY,
  UsuarioID       INTEGER NOT NULL,
  CitaID          INTEGER,
  Tipo            VARCHAR(50)  NOT NULL CHECK (Tipo IN ('Recordatorio','Confirmacion','Cancelacion','Reagenda','Sistema')),
  Mensaje         VARCHAR(500) NOT NULL,
  Leida           BOOLEAN      NOT NULL DEFAULT FALSE,
  FechaEnvio      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID),
  FOREIGN KEY (CitaID) REFERENCES Citas(CitaID)
);


-- =============================================
-- MIGRACION INCREMENTAL (BD YA EXISTENTE)
-- Flujo de aprobacion de registro para psicologas por rol admin
-- =============================================

-- 1) Crear tabla de solicitudes de registro para psicologas.
--    Nota: NO crea usuarios activos; solo almacena solicitudes pendientes.
CREATE TABLE IF NOT EXISTS SolicitudesRegistroPsicologas (
  SolicitudID             SERIAL PRIMARY KEY,
  Nombre                  VARCHAR(100)  NOT NULL,
  ApellidoPaterno         VARCHAR(100)  NOT NULL,
  ApellidoMaterno         VARCHAR(100),
  Correo                  VARCHAR(150)  NOT NULL,
  ContrasenaHash          VARCHAR(256)  NOT NULL,
  Telefono                VARCHAR(15),
  CedulaProfesional       VARCHAR(20)   NOT NULL,
  Especialidad            VARCHAR(150),
  EstadoSolicitud         VARCHAR(20)   NOT NULL DEFAULT 'Pendiente'
                                      CHECK (EstadoSolicitud IN ('Pendiente', 'Aprobada', 'Rechazada')),
  MotivoRevision          VARCHAR(500),
  UsuarioAdminRevisionID  INTEGER,
  UsuarioCreadoID         INTEGER,
  FechaSolicitud          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FechaRevision           TIMESTAMP,
  FOREIGN KEY (UsuarioAdminRevisionID) REFERENCES Usuarios(UsuarioID),
  FOREIGN KEY (UsuarioCreadoID) REFERENCES Usuarios(UsuarioID)
);

-- 2) Asegurar que no exista mas de una solicitud pendiente por correo.
CREATE UNIQUE INDEX IF NOT EXISTS uq_solicitudes_psico_correo_pendiente
  ON SolicitudesRegistroPsicologas (Correo)
  WHERE EstadoSolicitud = 'Pendiente';

-- 3) Asegurar que no exista mas de una solicitud pendiente por cedula.
CREATE UNIQUE INDEX IF NOT EXISTS uq_solicitudes_psico_cedula_pendiente
  ON SolicitudesRegistroPsicologas (CedulaProfesional)
  WHERE EstadoSolicitud = 'Pendiente';

-- 4) Indices para bandeja admin (consulta por estado y fecha).
CREATE INDEX IF NOT EXISTS ix_solicitudes_psico_estado_fecha
  ON SolicitudesRegistroPsicologas (EstadoSolicitud, FechaSolicitud DESC);

-- 5) (Opcional) Insertar usuario admin semilla si no existe.
--    Reemplaza el hash por uno real de bcrypt antes de ejecutar en produccion.
-- INSERT INTO Usuarios (Nombre, ApellidoPaterno, Correo, ContrasenaHash, Rol, Activo)
-- SELECT 'Admin', 'Sistema', 'admin@psicoagenda.com', '$2b$10$REEMPLAZAR_HASH_BCRYPT', 'admin', TRUE
-- WHERE NOT EXISTS (
--   SELECT 1 FROM Usuarios WHERE Correo = 'admin@psicoagenda.com'
-- );

-- 6) Recomendacion operacional:
--    - El endpoint publico de registro de psicologa debe insertar aqui.
--    - Solo un admin debe poder cambiar EstadoSolicitud a Aprobada/Rechazada.
--    - Al aprobar: crear registro en Usuarios + Psicologas dentro de una transaccion.

