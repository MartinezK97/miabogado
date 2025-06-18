let irpfConfig = null;

async function cargarIRPF() {
    try {
        const res = await fetch("../../assets/json/irpf.json");
        if (!res.ok) throw new Error("No se pudo cargar el archivo");
        const data = await res.json();
        irpfConfig = data;
        console.log("IRPF cargado:", data);
    } catch (error) {
        console.error("Error al cargar IRPF:", error);
    }
}

window.onload = async function () {
    await cargarIRPF();

    // Escuchar cambios en inputs dentro del contenedor
    document.querySelectorAll('#calculadoraDeAguinaldo input').forEach(input => {
        input.addEventListener('input', calcularAguinaldo);
    });

    document.querySelectorAll('input[name="hasChilds"]').forEach(radio => {
        radio.addEventListener('change', calcularAguinaldo);
    });
};

function calcularAguinaldo() {
    if (!irpfConfig) return; // no continuar si aún no está cargado

    const salarioInput = document.getElementById('salario');
    const salario = parseFloat(salarioInput.value) || 0;

    const selected = document.querySelector('input[name="hasChilds"]:checked');
    const tieneHijos = selected ? parseInt(selected.value) : 0;

    const aguinaldo_nominal = (salario * 6) / 12;

    // Descuentos fijos
    const montepio = salario * 0.15;
    const fonasa = salario * 0.03;
    const frl = salario * 0.00125;

    // Asignaciones familiares
    const asnis_percent = tieneHijos ? 3 : 1.5;
    const asnis_amount = salario * (asnis_percent / 100);

    document.getElementById("asnis_percent").innerHTML = asnis_percent + "%";
    document.getElementById("asnis_amount").innerHTML = "$" + asnis_amount.toFixed(2);

    // IRPF en base al aguinaldo nominal
    const ingresoEnBPC = aguinaldo_nominal / irpfConfig.bpc;
    const rango = irpfConfig.ranges.find(r => {
        if (r.to === null || r.to === "" || typeof r.to === "undefined") return ingresoEnBPC >= r.from;
        return ingresoEnBPC >= r.from && ingresoEnBPC <= r.to;
    });

    const irpf_percent = rango ? rango.rate : 0;
    const irpf_amount = aguinaldo_nominal * (irpf_percent / 100);

    // Total descuentos
    const descuento_total = montepio + fonasa + frl + asnis_amount + irpf_amount;
    const aguinaldo_liquido = aguinaldo_nominal - descuento_total;

    // Mostrar resultados
    document.getElementById("montepio").innerHTML = "$" + montepio.toFixed(2);
    document.getElementById("frl").innerHTML = "$" + frl.toFixed(2);
    document.getElementById("fonasa").innerHTML = "$" + fonasa.toFixed(2);
    document.getElementById("irpf_percent").innerHTML = irpf_percent + "%";
    document.getElementById("irpf_amount").innerHTML = "$" + irpf_amount.toFixed(2);

    document.getElementById("aguinaldo_nominal").innerHTML = "$" + aguinaldo_nominal.toFixed(2);
    document.getElementById("aguinaldo_liquido").innerHTML = "$" + aguinaldo_liquido.toFixed(2);

    console.log("Montepío:", montepio);
}