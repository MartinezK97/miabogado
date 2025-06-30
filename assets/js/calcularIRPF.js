let irpfConfig = null;

async function cargarIRPF() {
    try {
        const res = await fetch("http://miabogado.uy/assets/json/irpf.json");
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
    document.getElementById("range-2").style.display = 'none';
    document.getElementById("range-3").style.display = 'none';
    document.getElementById("range-4").style.display = 'none';
    document.getElementById("range-5").style.display = 'none';
    document.getElementById("range-6").style.display = 'none';
    document.getElementById("range-7").style.display = 'none';
    document.getElementById("range-8").style.display = 'none';
    // Escuchar cambios en inputs dentro del contenedor
    document.getElementById('irpf_nominal').addEventListener('input', init);



};

function init(){
    const nominal =  document.getElementById("irpf_nominal").value
    const irpf = calcularIRPF(nominal);
    console.log(irpf)
    // console.log(irpf.steps.length)
        for(i=0; i < irpf['steps'].length; i++){
            document.getElementById("range-"+(i + 1)).style.display = "grid";
            console.log("step "+ i)
    }
}

// function calcularIRPF(ingresoBruto) {
//     document.getElementById("range-2").style.display = 'none';
//     document.getElementById("range-3").style.display = 'none';
//     document.getElementById("range-4").style.display = 'none';
//     document.getElementById("range-5").style.display = 'none';
//     document.getElementById("range-6").style.display = 'none';
//     document.getElementById("range-7").style.display = 'none';
//     document.getElementById("range-8").style.display = 'none';

//     var nominal = document.getElementById("irpf_nominal").value 
//     const bpc = irpfConfig.bpc;
//     const ranges = irpfConfig.ranges; // Debe estar ordenado de menor a mayor
//     let totalImpuesto = 0;
//     let tramoSuperior = null;
//     console.log(nominal / bpc)

//     // 1. Calcular impuesto por cada tramo acumulativo
//     for (const tramo of ranges) {
//         const limiteInferior = tramo.from * bpc;
//         const limiteSuperior = tramo.to * bpc;

//         // Si el ingreso no supera el límite inferior del tramo, saltar
//         if (nominal <= limiteInferior) break;

//         // Calcular el monto gravable en este tramo
//         const excedente = Math.min(nominal, limiteSuperior) - limiteInferior;
//         const impuestoTramo = excedente * (tramo.rate / 100);
//         console.log("Excedente: $" + excedente)
//         console.log("Retencion: " + tramo.rate + "%")
//         console.log("Descuento: $" + impuestoTramo )

//         totalImpuesto += impuestoTramo;
//         tramoSuperior = tramo; // Último tramo aplicado
//         console.log("$" + impuestoTramo + " en la franja: ", (1 + ranges.indexOf(tramo)) )
//         var rangeid = "range-" + (1 +  ranges.indexOf(tramo))
//         document.getElementById(rangeid).style.display = 'grid';
//         if(nominal <= (bpc * 7)){
//             document.querySelector("#" + rangeid + " .exceced p").innerHTML = "$"+ num(7 * bpc)

//         }else{
//             document.querySelector("#" + rangeid + " .exceced p").innerHTML = "$"+num(excedente)
//         }
//         document.querySelector("#" + rangeid +" .amount p" ).innerHTML = "$"+num(impuestoTramo)
//     }

//     // 2. Si no se aplicó ningún tramo, usar el primero (ej: ingresos < 15 BPC)
//     if (tramoSuperior === null) {
//         tramoSuperior = ranges[0];
//     }

//     return {
//         "price_bpc": bpc,
//         "min_bpc": tramoSuperior.from,
//         "min_amount": tramoSuperior.from * bpc,
//         "max_bpc": tramoSuperior.to,
//         "max_amount": tramoSuperior.to * bpc,
//         "rate": tramoSuperior.rate,
//         "discount_amount": totalImpuesto, // Total acumulado de todos los tramos
//     };
// }

function calcularIRPF(nominal) {
   
    const bpc = irpfConfig.bpc;
    const ranges = irpfConfig.ranges; // Debe estar ordenado de menor a mayor
    var nominalEnBPC = (nominal / bpc);
    var mni = bpc * 7
    var res = {
        "bpc": bpc,
        "nominal": nominal,
        "nominal_en_BPC": nominalEnBPC,
        "steps":{}
    }

    if(nominal < mni){ return false;}
    var total_discount = 0;
    for(var i=0; i < ranges.length; i++){
            var minAmount = ranges[i].from * bpc
            var maxAmount = ranges[i].to * bpc
            var dif = 0;
            var range_discount = 0;
            if(nominal > minAmount){
                // Si el monto no supera la berrera superior
                if(nominal < maxAmount){
                    dif = nominal - minAmount
                    range_discount = (ranges[i].rate / 100) * dif
                    total_discount += range_discount
                    res["steps"][i] = {
                        "exceso": dif,
                        "tasa": ranges[i].rate,
                        "amount": range_discount,
                    }
                }else{
                    // El monto supera la barrera superior
                    dif = maxAmount - minAmount
                    range_discount = (ranges[i].rate / 100) * dif
                    total_discount += range_discount
                    res["steps"][i] = {
                        "exceso":dif,
                        "tasa": ranges[i].rate,
                        "amount":range_discount,
                    }
                }

            }
    }

    res["total_discount"] = total_discount;
    res["liquido"] = nominal - total_discount;
    return res;
}


function num(n) {
    const numero = parseFloat(n);
    if (isNaN(numero)) return 'NaN';

    return numero.toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}