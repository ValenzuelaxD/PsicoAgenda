import type { CSSProperties } from "react";
import "../styles/landing.css";

export default function LandingPage() {
  return (
    <div className="landing-root">
      <div className="landing-bg" aria-hidden="true">
        <div className="landing-orb landing-orb--one" />
        <div className="landing-orb landing-orb--two" />
        <div className="landing-orb landing-orb--three" />
      </div>

      <header className="landing-nav landing-reveal" style={{ "--delay": "0.05s" } as CSSProperties}>
        <div className="landing-brand">
          <span className="landing-logo">PsicoAgenda</span>
          <span className="landing-tagline">Gestion clinica con calidez y orden</span>
        </div>
        <nav className="landing-nav-actions">
          <a className="landing-link" href="#funcionalidades">
            Funcionalidades
          </a>
          <a className="landing-link" href="#para-quien">
            Para quien
          </a>
          <a className="landing-link" href="#faq">
            FAQ
          </a>
          <a className="landing-link landing-link--ghost" href="/app">
            Entrar
          </a>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-text">
            <p className="landing-eyebrow landing-reveal" style={{ "--delay": "0.12s" } as CSSProperties}>
              PsicoAgenda para psicologos y clinicas
            </p>
            <h1 className="landing-title landing-reveal" style={{ "--delay": "0.18s" } as CSSProperties}>
              Agenda clinica inteligente, disenada para tu forma de trabajar
            </h1>
            <p className="landing-subtitle landing-reveal" style={{ "--delay": "0.24s" } as CSSProperties}>
              Organiza citas, automatiza recordatorios y mantiene el historial clinico al dia, sin perder el toque
              humano.
            </p>
            <div className="landing-cta-row landing-reveal" style={{ "--delay": "0.3s" } as CSSProperties}>
              <a className="landing-button" href="mailto:info@psicoagenda.online">
                Escribir a soporte
              </a>
              <a className="landing-button landing-button--ghost" href="#funcionalidades">
                Ver funcionalidades
              </a>
            </div>
            <p className="landing-microcopy landing-reveal" style={{ "--delay": "0.36s" } as CSSProperties}>
              Respondemos en menos de 24 horas habiles.
            </p>
          </div>
          <div className="landing-hero-card landing-reveal" style={{ "--delay": "0.22s" } as CSSProperties}>
            <div className="landing-card-header">
              <span>Hoy</span>
              <span className="landing-pill">Agenda equilibrada</span>
            </div>
            <div className="landing-card-body">
              <div className="landing-card-block">
                <p className="landing-card-title">Sesiones confirmadas</p>
                <p className="landing-card-value">8</p>
                <p className="landing-card-note">Recordatorios automaticos enviados</p>
              </div>
              <div className="landing-card-block landing-card-block--accent">
                <p className="landing-card-title">Pacientes activos</p>
                <p className="landing-card-value">36</p>
                <p className="landing-card-note">Seguimiento clinico centralizado</p>
              </div>
            </div>
            <div className="landing-card-footer">
              <span>Ultima actualizacion</span>
              <span>Hace 2 minutos</span>
            </div>
          </div>
        </section>

        <section className="landing-section landing-problem landing-reveal" style={{ "--delay": "0.08s" } as CSSProperties}>
          <div>
            <h2 className="landing-section-title">Menos tareas manuales. Mas tiempo para tus pacientes.</h2>
            <p className="landing-section-text">
              PsicoAgenda te ayuda a mantener el control de tu agenda y del historial clinico sin dispersarte entre
              mensajes, hojas de calculo y recordatorios manuales.
            </p>
          </div>
          <ul className="landing-list">
            <li>Confirmaciones organizadas, sin mensajes perdidos.</li>
            <li>Historial clinico estructurado y listo para cada sesion.</li>
            <li>Disponibilidad clara para tomar mejores decisiones.</li>
          </ul>
        </section>

        <section id="funcionalidades" className="landing-section">
          <div className="landing-section-header landing-reveal" style={{ "--delay": "0.08s" } as CSSProperties}>
            <h2 className="landing-section-title">Todo lo que necesitas para tu practica</h2>
            <p className="landing-section-text">Funcionalidades pensadas para el ritmo real de una consulta psicologica.</p>
          </div>
          <div className="landing-grid">
            {[
              {
                title: "Agenda y programacion",
                text: "Citas ordenadas, reprogramaciones faciles y disponibilidad clara.",
              },
              {
                title: "Notificaciones automaticas",
                text: "Recordatorios que reducen ausencias y mejoran la puntualidad.",
              },
              {
                title: "Historial clinico",
                text: "Registro seguro y estructurado por paciente.",
              },
              {
                title: "Reportes y seguimiento",
                text: "Indicadores claros para decidir mejor y crecer.",
              },
              {
                title: "Integraciones virtuales",
                text: "Sesiones online con flujo sencillo y centralizado.",
              },
              {
                title: "Experiencia confiable",
                text: "Una interfaz clara que se siente familiar desde el primer dia.",
              },
            ].map((item, index) => (
              <article
                className="landing-card landing-reveal"
                style={{ "--delay": `${0.1 + index * 0.06}s` } as CSSProperties}
                key={item.title}
              >
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="para-quien" className="landing-section landing-split">
          <div className="landing-section-header landing-reveal" style={{ "--delay": "0.08s" } as CSSProperties}>
            <h2 className="landing-section-title">Disenado para tu forma de trabajar</h2>
            <p className="landing-section-text">
              Ya seas independiente, parte de una clinica o responsable de administracion, PsicoAgenda se adapta a tu
              flujo.
            </p>
          </div>
          <div className="landing-split-grid">
            {[
              {
                title: "Psicologos independientes",
                text: "Organiza pacientes, registra avances y reduce tareas administrativas.",
              },
              {
                title: "Clinicas",
                text: "Coordina profesionales, visibilidad compartida y seguimiento consistente.",
              },
              {
                title: "Administracion",
                text: "Reportes claros, control de agendas y flujo ordenado de pacientes.",
              },
            ].map((item, index) => (
              <article
                className="landing-panel landing-reveal"
                style={{ "--delay": `${0.12 + index * 0.08}s` } as CSSProperties}
                key={item.title}
              >
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="seguridad" className="landing-section landing-trust">
          <div className="landing-section-header landing-reveal" style={{ "--delay": "0.08s" } as CSSProperties}>
            <h2 className="landing-section-title">Seguridad y confianza en cada sesion</h2>
            <p className="landing-section-text">
              La informacion clinica se mantiene protegida con procesos claros y un entorno pensado para la confianza.
            </p>
          </div>
          <div className="landing-trust-grid">
            <div className="landing-metrics landing-reveal" style={{ "--delay": "0.14s" } as CSSProperties}>
              <div>
                <h3>Transparencia en el manejo de datos</h3>
                <p>Protocolos definidos y comunicacion clara para pacientes y profesionales.</p>
              </div>
              <div>
                <h3>Acceso seguro</h3>
                <p>Proteccion de sesiones y control de permisos por rol.</p>
              </div>
              <div>
                <h3>Respaldo continuo</h3>
                <p>Tu informacion se mantiene disponible y organizada cuando la necesitas.</p>
              </div>
            </div>
            <div className="landing-trust-card landing-reveal" style={{ "--delay": "0.22s" } as CSSProperties}>
              <p className="landing-quote">
                "Ahora tengo agenda e historial en un solo lugar. El seguimiento de mis pacientes es mucho mas claro."
              </p>
              <p className="landing-quote-author">Psicologa clinica</p>
              <div className="landing-trust-badges">
                <span>Privacidad</span>
                <span>Calidez</span>
                <span>Orden</span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section landing-cta">
          <div className="landing-cta-inner landing-reveal" style={{ "--delay": "0.08s" } as CSSProperties}>
            <div>
              <h2>Listo para mejorar tu gestion diaria?</h2>
              <p>Conversemos y resolvemos tus dudas sobre PsicoAgenda.</p>
            </div>
            <div className="landing-cta-actions">
              <a className="landing-button" href="mailto:info@psicoagenda.online">
                Escribir a soporte
              </a>
              <a className="landing-button landing-button--ghost" href="/app">
                Entrar a la plataforma
              </a>
            </div>
          </div>
        </section>

        <section id="faq" className="landing-section landing-faq">
          <div className="landing-section-header landing-reveal" style={{ "--delay": "0.08s" } as CSSProperties}>
            <h2 className="landing-section-title">Preguntas frecuentes</h2>
            <p className="landing-section-text">Lo esencial antes de empezar.</p>
          </div>
          <div className="landing-faq-grid">
            {[
              {
                q: "Que necesito para empezar?",
                a: "Solo acceso a internet y tus datos de pacientes basicos para comenzar a organizar tu agenda.",
              },
              {
                q: "Puedo migrar mis pacientes?",
                a: "Si, puedes importar la informacion existente de manera ordenada y segura.",
              },
              {
                q: "Funciona en movil?",
                a: "Si, esta optimizado para desktop, tablet y movil.",
              },
              {
                q: "Hay soporte?",
                a: "Nuestro equipo responde por correo en menos de 24 horas habiles.",
              },
            ].map((item, index) => (
              <article
                className="landing-faq-item landing-reveal"
                style={{ "--delay": `${0.12 + index * 0.06}s` } as CSSProperties}
                key={item.q}
              >
                <h3>{item.q}</h3>
                <p>{item.a}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div>
          <strong>PsicoAgenda</strong>
          <p>Agenda clinica inteligente para psicologos.</p>
        </div>
        <div className="landing-footer-links">
          <a href="mailto:info@psicoagenda.online">info@psicoagenda.online</a>
          <a href="/app">Entrar a la plataforma</a>
        </div>
      </footer>
    </div>
  );
}
