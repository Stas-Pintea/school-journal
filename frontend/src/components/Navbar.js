import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="fas fa-school me-2"></i>
          SAP
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">

            <li className="nav-item">
              <Link className="nav-link" to="/classes">
                <i className="fas fa-book me-1"></i> Журналы
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/students">
                <i className="fas fa-user-graduate me-1"></i> Ученики
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/teachers">
                <i className="fas fa-chalkboard-teacher me-1"></i> Учителя
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/subjects">
                <i className="fas fa-book-open me-1"></i> Предметы
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/assignments">
                <i className="fas fa-tasks me-1"></i> Назначения
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/academic-calendar">
                <i className="fas fa-calendar-alt me-1"></i> Учебный календарь
              </Link>
            </li>

          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
