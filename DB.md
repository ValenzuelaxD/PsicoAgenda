-- =============================================
-- BASE DE DATOS: PsicoAgenda (PostgreSQL compatible con Google Cloud SQL)
-- Instituto Tecnológico de Tepic - ISC
-- Adaptado para PostgreSQL y Google Cloud
-- =============================================

-- Crear extensión para UUID si es necesaria
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
-- INDICES PARA MEJORAR RENDIMIENTO
-- =============================================

CREATE INDEX idx_usuarios_correo ON Usuarios(Correo);
CREATE INDEX idx_usuarios_rol ON Usuarios(Rol);
CREATE INDEX idx_citas_paciente ON Citas(PacienteID);
CREATE INDEX idx_citas_psicologa ON Citas(PsicologaID);
CREATE INDEX idx_citas_fechahora ON Citas(FechaHora);
CREATE INDEX idx_citas_estado ON Citas(Estado);
CREATE INDEX idx_notificaciones_usuario ON Notificaciones(UsuarioID);

-- =============================================
-- DATOS DE PRUEBA
-- =============================================

-- Usuarios (psicologas, pacientes y admin)
INSERT INTO Usuarios (Nombre, ApellidoPaterno, ApellidoMaterno, Correo, ContrasenaHash, Telefono, Rol) VALUES
('Laura',    'Martinez',  'Lopez',     'laura.martinez@psicoagenda.com',   '90759150667a27dc4585b2a6f7cb7c9158067efb2dac721c1589549fe9ab86b2', '3111234567', 'psicologa'),
('Monica',   'Reyes',     'Gutierrez', 'monica.reyes@psicoagenda.com',     'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', '3119876543', 'psicologa'),
('Admin',    'Sistema',   NULL,        'admin@psicoagenda.com',            'f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5', '3110000000', 'admin'),
('Carlos',   'Gonzalez',  'Perez',     'carlos.gonzalez@email.com',        '9f2a1b3c5d7e8f0a2b4c6d8e0f1a3b5c', '3117654321', 'paciente'),
('Maria',    'Lopez',     'Sanchez',   'maria.lopez@email.com',            'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6', '3112345678', 'paciente'),
('Jorge',    'Hernandez', 'Ruiz',      'jorge.hernandez@email.com',        'c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7', '3113456789', 'paciente'),
('Ana',      'Torres',    'Mendoza',   'ana.torres@email.com',             'd3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8', '3114567890', 'paciente'),
('Roberto',  'Diaz',      'Flores',    'roberto.diaz@email.com',           'e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9', '3115678901', 'paciente'),
('Patricia', 'Morales',   'Vega',      'patricia.morales@email.com',       'f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0', '3116789012', 'paciente'),
('Luis',     'Ramirez',   'Cruz',      'luis.ramirez@email.com',           'a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1', '3117890123', 'paciente'),
('Sofia',    'Vargas',    'Ortiz',     'sofia.vargas@email.com',           'b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2', '3118901234', 'paciente');

-- Psicologas
INSERT INTO Psicologas (UsuarioID, CedulaProfesional, Especialidad, Descripcion, Consultorio) VALUES
(1, 'CED-12345678', 'Psicologia Clinica',  'Especialista en terapia cognitivo-conductual con 10 años de experiencia.', 'Consultorio 101'),
(2, 'CED-87654321', 'Psicologia Infantil', 'Especialista en desarrollo infantil y adolescente con 7 años de experiencia.', 'Consultorio 102');

-- Pacientes
INSERT INTO Pacientes (UsuarioID, FechaNacimiento, Genero, Direccion, MotivoConsulta, ContactoEmergencia, TelEmergencia) VALUES
(4,  '1995-06-15', 'Masculino',          'Calle Hidalgo 123, Tepic, Nayarit',    'Manejo de ansiedad y estres laboral.',         'Maria Perez',    '3110001111'),
(5,  '1990-03-22', 'Femenino',           'Av. Mexico 456, Tepic, Nayarit',       'Depresion y problemas de autoestima.',          'Juan Lopez',     '3110002222'),
(6,  '1988-11-10', 'Masculino',          'Calle Morelos 789, Tepic, Nayarit',    'Manejo del estres postraumatico.',              'Rosa Ruiz',      '3110003333'),
(7,  '2000-07-05', 'Femenino',           'Blvd. Tepic 321, Nayarit',             'Ansiedad social y dificultad en relaciones.',   'Pedro Torres',   '3110004444'),
(8,  '1985-09-18', 'Masculino',          'Calle Juarez 654, Tepic, Nayarit',     'Insomnio y ataques de panico.',                 'Elena Flores',   '3110005555'),
(9,  '1998-01-30', 'Femenino',           'Av. Insurgentes 987, Tepic, Nayarit',  'Problemas familiares y duelo.',                 'Carlos Vega',    '3110006666'),
(10, '1993-04-12', 'Masculino',          'Calle Reforma 147, Tepic, Nayarit',    'Control de ira y manejo emocional.',            'Lucia Cruz',     '3110007777'),
(11, '2002-12-25', 'Prefiero no decir',  'Av. Allende 258, Tepic, Nayarit',      'Orientacion vocacional y estres academico.',    'Jose Ortiz',     '3110008888');

-- Agendas
INSERT INTO Agendas (PsicologaID, DiaSemana, HoraInicio, HoraFin) VALUES
(1, 'Lunes',      '09:00', '18:00'),
(1, 'Martes',     '09:00', '18:00'),
(1, 'Miercoles',  '09:00', '18:00'),
(1, 'Jueves',     '09:00', '18:00'),
(1, 'Viernes',    '09:00', '17:00'),
(2, 'Lunes',      '08:00', '14:00'),
(2, 'Miercoles',  '08:00', '14:00'),
(2, 'Viernes',    '08:00', '14:00'),
(2, 'Sabado',     '09:00', '13:00');

-- Citas
INSERT INTO Citas (PacienteID, PsicologaID, FechaHora, DuracionMin, Estado, Modalidad, NotasPaciente) VALUES
(1, 1, '2025-11-10 10:00:00', 60, 'Completada',  'Presencial', 'Primera consulta, manejo del estres.'),
(2, 1, '2025-11-12 11:00:00', 60, 'Completada',  'Presencial', 'Seguimiento depresion.'),
(3, 2, '2025-11-14 09:00:00', 60, 'Completada',  'En linea',   'Primera sesion online.'),
(1, 1, '2026-03-10 10:00:00', 60, 'Confirmada',  'Presencial', 'Continuacion del tratamiento.'),
(2, 1, '2026-03-11 11:00:00', 60, 'Pendiente',   'Presencial', 'Revision de avances.'),
(3, 2, '2026-03-12 09:00:00', 60, 'Confirmada',  'En linea',   'Sesion de seguimiento.'),
(4, 1, '2026-03-13 12:00:00', 60, 'Pendiente',   'Presencial', 'Primera consulta ansiedad social.'),
(5, 2, '2026-03-14 10:00:00', 60, 'Confirmada',  'Presencial', 'Tratamiento insomnio.'),
(6, 1, '2026-03-17 14:00:00', 60, 'Cancelada',   'Presencial', 'Terapia de duelo.'),
(7, 1, '2026-03-18 15:00:00', 60, 'Pendiente',   'Presencial', 'Control de ira, primera sesion.'),
(8, 2, '2026-03-19 09:00:00', 60, 'Confirmada',  'En linea',   'Orientacion vocacional.');

-- Notificaciones
INSERT INTO Notificaciones (UsuarioID, CitaID, Tipo, Mensaje, Leida) VALUES
(4, 4, 'Confirmacion',   'Tu cita del 10 de marzo a las 10:00 ha sido confirmada.', TRUE),
(4, 4, 'Recordatorio',   'Recordatorio: tienes una cita mañana 10 de marzo a las 10:00.', TRUE),
(5, 5, 'Recordatorio',   'Recordatorio: tienes una cita el 11 de marzo a las 11:00.', FALSE),
(1, NULL, 'Sistema',     'Se han registrado 3 nuevas solicitudes de cita pendientes de revision.', FALSE);
(1, NULL, 'Sistema',     'Se han registrado 3 nuevas solicitudes de cita pendientes de revision.', FALSE);