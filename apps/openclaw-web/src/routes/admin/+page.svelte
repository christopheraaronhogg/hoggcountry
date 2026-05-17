<svelte:head>
  <title>Admin | Hogg Country</title>
</svelte:head>

<main class="admin-home">
  <div class="card admin-card">
    <h1>Admin</h1>
    <p>Hogg Country admin tools.</p>
    <ul>
      <li><a href="/admin/updates">Trail Updates Admin</a></li>
    </ul>
  </div>
</main>

<style>
  .admin-home {
    width: min(720px, calc(100% - 2rem));
    margin: 0 auto;
    padding: 2rem 0;
  }

  .admin-card {
    padding: 1rem 1.25rem;
  }

  h1 {
    margin-top: 0;
  }

  a {
    color: var(--pine);
    font-weight: 800;
  }
</style>
