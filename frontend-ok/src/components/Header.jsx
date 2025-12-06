import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-content">
        {/* Logo UMSA a la izquierda */}
        <div className="logo-left">
          <div className="logo-container umsa-logo">
            <img 
              src="https://iicca.umsa.bo/documents/201681/226720/Logo+UMSA.png/8af29e61-18e7-1f56-116a-2ff3d8c1b1ec?version=1.1&t=1565828004942&download=true" 
              alt="Logo UMSA" 
              className="logo"
            />
            <div className="logo-text-container">
              <span className="university-name">UNIVERSIDAD MAYOR DE SAN ANDRÉS</span>
              <span className="faculty-name">FACULTAD DE CIENCIAS PURAS Y NATURALES</span>
              <span className="career-name">CARRERA DE INFORMÁTICA</span>
            </div>
          </div>
        </div>

        {/* Título central */}
        <div className="header-center">
          <h1 className="project-title">
            <span className="title-main">MÉTODO DE LA SECANTE</span>
            <span className="title-sub">PARA FUNCIONES COMPLEJAS</span>
          </h1>
        </div>

        <div className="logo-right">
          <div className="logo-container informatica-logo">
            <div className="logo-text-container">
              <span className="subject-name">Métodos numericos I</span>
              <span className="subject-code">INF-373</span>
              <span className="semester">II/2025</span>
            </div>
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" 
              alt="Logo Informática" 
              className="logo"
            />
          </div>
        </div>
      </div>

      {/* Equipo de desarrollo */}
      <div className="team-section">
        <div className="team-header">
          <span className="team-label">EQUIPO DE DESARROLLO:</span>
          <div className="team-divider"></div>
        </div>
        <div className="members-grid">
          <div className="member-card">
            <div className="member-avatar">
              <div className="avatar-image">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" 
                  alt="Mauricio Jhostin" 
                  className="avatar-img"
                />
              </div>
            </div>
            <div className="member-info">
              <span className="member-name">CALLEJAS ESCOBAR MAURICIO JHOSTIN</span>
              <span className="member-role">Ingenieria de Sistemas</span>
            </div>
          </div>
          
          <div className="member-card">
            <div className="member-avatar">
              <div className="avatar-image">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" 
                  alt="Fabricio Oliver" 
                  className="avatar-img"
                />
              </div>
            </div>
            <div className="member-info">
              <span className="member-name">ECHEVERRÍA POMA FABRICIO OLIVER</span>
              <span className="member-role">Ingenieria de Sistemas</span>
            </div>
          </div>
          
          <div className="member-card">
            <div className="member-avatar">
              <div className="avatar-image">
                <img 
                  src="https://avatars.githubusercontent.com/u/140029048?s=400&u=830ec0222edadebc3ac1d40f6d28f15a07eac13e&v=4" 
                  alt="Joel Hernán" 
                  className="avatar-img"
                />
              </div>
            </div>
            <div className="member-info">
              <span className="member-name">TANCARA SUÑAGUA JOEL HERNÁN</span>
              <span className="member-role">Desarrollo de Software</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;