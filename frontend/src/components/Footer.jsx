import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="footer-logo">LMS Platform</h3>
          <p>La solution complète pour la gestion de la formation et le suivi des compétences.</p>
        </div>
        <div className="footer-section">
          <h4>Navigation</h4>
          <ul>
            <li><a href="/tl/dashboard">Dashboard</a></li>
            <li><a href="/tl/courses">Cours</a></li>
            <li><a href="/tl/groups">Groupes</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Support</h4>
          <ul>
            <li><a href="#">Centre d'aide</a></li>
            <li><a href="#">Contactez-nous</a></li>
            <li><a href="#">Documentation</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Capgemini. Tous droits réservés.</p>
      </div>
    </footer>
  );
};

export default Footer;
