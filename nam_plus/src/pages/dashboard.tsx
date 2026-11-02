export default function Dashboard() {
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  }

  return (
    <div>
      <header>
        <h1>Ñam+</h1>

        <div>
          <span>
            Hola, {user.name || "Usuario"}
          </span>

          <button onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main>
        <section>
          <p>Mis puntos</p>
          <h2>1,250 pts</h2>
        </section>

        <section>
          <h2>Promociones destacadas</h2>

          <div>
            <div>
              <h3>20% de descuento</h3>
              <p>Restaurante Demo</p>
            </div>

            <div>
              <h3>Bebida gratis</h3>
              <p>Con compras mayores a $300</p>
            </div>
          </div>
        </section>

        <section>
          <h2>Canjear ticket</h2>

          <button>
            Escanear QR
          </button>

          <button>
            Ingresar código
          </button>
        </section>

        <section>
          <h2>Actividad reciente</h2>

          <p>+100 puntos por compra</p>
          <p>-500 puntos por canje</p>
        </section>
      </main>
    </div>
  );
}