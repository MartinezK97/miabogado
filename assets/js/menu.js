document.addEventListener('DOMContentLoaded', function () {
    const btnMenu = document.querySelector('.btn-menu');
    const menu = document.getElementById('menu');

    // Función para cerrar el menú
    function closeMenu() {
        menu.classList.remove('open');
    }

    // Evento del botón
    btnMenu.addEventListener('click', function (e) {
        console.log("click")
        e.stopPropagation();
        menu.classList.toggle('open');
    });

    // Cerrar al hacer clic fuera del menú
    document.addEventListener('click', function (e) {
        if (menu.classList.contains('open') &&
            !menu.contains(e.target) &&
            e.target !== btnMenu) {
            closeMenu();
        }
    });

    // Cerrar con la tecla ESC (opcional pero recomendado)
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('open')) {
            closeMenu();
        }
    });
});