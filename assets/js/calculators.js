let irpfConfig = null;

async function cargarIRPF() {
    try {
        const res = await fetch("https://martinezk97.github.io/miabogado/assets/json/irpf.json");
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
    const montepio = aguinaldo_nominal * 0.15;
    const fonasa = aguinaldo_nominal * 0.03;
    const frl = aguinaldo_nominal * 0.00125;

    // Asignaciones familiares
    const asnis_percent = tieneHijos ? 3 : 1.5;
    const asnis_amount = aguinaldo_nominal * (asnis_percent / 100);

    document.getElementById("asnis_percent").innerHTML = asnis_percent + "%";
    document.getElementById("asnis_amount").innerHTML = "$" + asnis_amount.toFixed(2);

    // IRPF en base al aguinaldo nominal
   const irpf = calcularIRPF(aguinaldo_nominal);

    const irpf_percent = irpf.rate;
    const irpf_amount = irpf.discount_amount;

    // Total descuentos
    const descuento_total = montepio + fonasa + frl + asnis_amount + irpf_amount;
    const aguinaldo_liquido = aguinaldo_nominal - descuento_total;

    // Mostrar resultados
    document.getElementById("montepio").innerHTML = "$" + num(montepio);
    document.getElementById("frl").innerHTML = "$" + num(frl);
    document.getElementById("fonasa").innerHTML = "$" + num(fonasa);
    
    //IRPF
    document.getElementById("irpf_percent").innerHTML = num(irpf_percent) + "%";
    document.getElementById("irpf_amount").innerHTML = "$" + num(irpf_amount);
    // Precio de BPC 
    document.getElementById("bpc_price").innerHTML = "$" + num(irpf.price_bpc);
    document.getElementById("bpc_range").innerHTML = irpf.min_bpc + " - " + irpf.max_bpc;
    document.getElementById("amount_range").innerHTML = "$" + irpf.min_amount + " - $" + irpf.max_amount;
    document.getElementById("discount_percent").innerHTML = irpf.rate + "%";

    document.getElementById("total_discount_amount").innerHTML = "$" + num(descuento_total);


    document.getElementById("aguinaldo_nominal").innerHTML = "$" + num(aguinaldo_nominal);
    document.getElementById("aguinaldo_liquido").innerHTML = "$" + num(aguinaldo_liquido);

    console.log("Montepío:", montepio);
}


export function calcularIRPF(ingresoBruto) {
    const bpc = irpfConfig.bpc;
    const ranges = irpfConfig.ranges; // Debe estar ordenado de menor a mayor
    let totalImpuesto = 0;
    let tramoSuperior = null;

    // 1. Calcular impuesto por cada tramo acumulativo
    for (const tramo of ranges) {
        const limiteInferior = tramo.from * bpc;
        const limiteSuperior = tramo.to * bpc;

        // Si el ingreso no supera el límite inferior del tramo, saltar
        if (ingresoBruto <= limiteInferior) break;

        // Calcular el monto gravable en este tramo
        const excedente = Math.min(ingresoBruto, limiteSuperior) - limiteInferior;
        console.log("Excedente: $" + excedente)
        const impuestoTramo = excedente * (tramo.rate / 100);

        totalImpuesto += impuestoTramo;
        tramoSuperior = tramo; // Último tramo aplicado
        console.log("$" + impuestoTramo + " en el tramo: ", tramo)

    }

    // 2. Si no se aplicó ningún tramo, usar el primero (ej: ingresos < 15 BPC)
    if (tramoSuperior === null) {
        tramoSuperior = ranges[0];
    }

    return {
        "price_bpc": bpc,
        "min_bpc": tramoSuperior.from,
        "min_amount": tramoSuperior.from * bpc,
        "max_bpc": tramoSuperior.to,
        "max_amount": tramoSuperior.to * bpc,
        "rate": tramoSuperior.rate,
        "discount_amount": totalImpuesto, // Total acumulado de todos los tramos
    };
}

function getPercent( percent, amount){
    return amount * (percent / 100)
}


function sumPercent(percent, amount) {
    return amount * (1 + (percent / 100))
}

function restPercent(percent, amount) {
    return amount * (1 - (percent / 100))
}

function num(n){
    const numero = parseFloat(n);
    if (isNaN(numero)) return 'NaN';

    return numero.toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}



