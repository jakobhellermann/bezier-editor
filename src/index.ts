let canvas = document.getElementById("canvas") as HTMLCanvasElement;
let buttonClear = document.getElementById("buttonClear") as HTMLButtonElement;

let optionDepth = document.getElementById("optionDepth") as HTMLInputElement;
let optionDepthCurrent = document.getElementById("optionDepthCurrent") as HTMLOutputElement;
let optionColorCurves = document.getElementById("optionColorCurves") as HTMLInputElement;
let optionControlPoints = document.getElementById("optionControlPoints") as HTMLInputElement;
let optionShowConstruction = document.getElementById("optionShowConstruction") as HTMLInputElement;
let optionConstructionParameter = document.getElementById("optionConstructionParameter") as HTMLInputElement;
let optionConstructionParameterCurrent = document.getElementById("optionConstructionParameterCurrent") as HTMLOutputElement;
optionDepthCurrent.value = optionDepth.value;
optionConstructionParameterCurrent.value = optionConstructionParameter.value;

let ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
if (ctx === null) throw new Error("could not get canvas context");

type Point = { x: number; y: number; };
type BezierCurve = Point[];



let initialCurve = [{ "x": 92, "y": 298 }, { "x": 163, "y": 130 }, { "x": 324, "y": 114 }, { "x": 435, "y": 291 }];

// global state:
let curves: BezierCurve[] = [initialCurve];
let options = {
    depth: optionDepth.valueAsNumber,
    colorCurves: optionColorCurves.checked,
    controlPoints: optionControlPoints.checked,
    showConstruction: optionShowConstruction.checked,
    constructionParameter: optionConstructionParameter.valueAsNumber,
};

// event listeners
canvas.addEventListener("click", canvasClick);

optionColorCurves.addEventListener("change", () => {
    options.colorCurves = optionColorCurves.checked;
    render();
});
optionControlPoints.addEventListener("change", () => {
    options.controlPoints = optionControlPoints.checked;
    render();
});
optionColorCurves.addEventListener("change", () => {
    options.colorCurves = optionColorCurves.checked;
    render();
});
optionDepth.addEventListener("input", () => {
    optionDepthCurrent.value = optionDepth.value;
    options.depth = optionDepth.valueAsNumber;
    render();
});
optionDepthCurrent.value = optionDepth.value;

optionShowConstruction.addEventListener("change", () => {
    options.showConstruction = optionShowConstruction.checked;
    optionConstructionParameter.disabled = !options.showConstruction;
    render();
});
optionConstructionParameter.addEventListener("input", () => {
    optionConstructionParameterCurrent.value = optionConstructionParameter.value;
    options.constructionParameter = optionConstructionParameter.valueAsNumber;
    render();
});
optionConstructionParameterCurrent.value = optionConstructionParameter.value;

buttonClear.addEventListener("click", () => {
    curves = [[]];
    render();
});

// drawing utils
function clear() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawLine(from: Point, to: Point) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
}
function drawLinesThrough(points: Point[]) {
    for (let i = 0; i < points.length - 1; i++) {
        drawLine(points[i], points[i + 1]);
    }
}

function drawPoint(from: Point, size = 4) {
    ctx.fillRect(from.x - size / 2, from.y - size / 2, size, size);
}

function reduceToConnecting(points: Point[], t: number) {
    return Array.from({ length: points.length - 1 }, (_, i) => {
        let from = points[i];
        let to = points[i + 1];
        /* 1/2(a+b) = 1/2 a + 1/2 b*/
        return { x: (1 - t) * from.x + t * to.x, y: (1 - t) * from.y + t * to.y };
    });
}
function calculateIntermediates(points: Point[], t: number): Point[][] {
    let intermediates = [points];
    for (let i = 1; i < points.length; i++) {
        let reduced = reduceToConnecting(intermediates[i - 1], t);
        intermediates.push(reduced);
    }

    return intermediates;
}

function drawBezierCasteljau(points: BezierCurve, depth = 5) {
    if (points.length <= 1) return;

    if (depth === 0) drawLine(points[0], points[points.length - 1]);
    else {
        let intermediates = calculateIntermediates(points, 0.5);

        drawBezierCasteljau(intermediates.map(points => points[0]), depth - 1);
        drawBezierCasteljau(intermediates.map(points => points[points.length - 1]), depth - 1);
    }
}

function drawBezierConstruction(curve: BezierCurve) {
    if (curve.length == 0) return;

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 0.8;

    let intermediates = calculateIntermediates(curve, options.constructionParameter);

    for (let i = 0; i < intermediates.length; i++) {
        ctx.strokeStyle = distinctColors[(i + 1) % distinctColors.length];
        let intermediate = intermediates[i];

        if (i > 0) {

            for (let point of intermediate) {
                ctx.fillStyle = "#00f";
                drawPoint(point);
            }
        }
        drawLinesThrough(intermediate);
    }

    ctx.fillStyle = "red";
    drawPoint(intermediates[intermediates.length - 1][0], 6);
}



function canvasClick(event: MouseEvent) {
    // begin new curve
    if (event.shiftKey) {
        if (curves[curves.length - 1].length > 0) {
            curves.push([]);
        }
    }

    let rect = canvas.getBoundingClientRect();
    curves[curves.length - 1].push({ x: event.clientX - rect.left, y: event.clientY - rect.top });

    render();
}

let distinctColors = ["#191970", "#006400", "#ff0000", "#00ff00", "#00ffff", "#ff00ff", "#ffb6c1"];
function render() {
    clear();

    for (let i = 0; i < curves.length; i++) {
        let curve = curves[i];
        if (options.controlPoints) {
            ctx.fillStyle = "#000000";
            for (const point of curve) drawPoint(point);
        }

        if (options.colorCurves) ctx.strokeStyle = distinctColors[i % distinctColors.length];
        else ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        drawBezierCasteljau(curve, options.depth);

        if (options.showConstruction) {
            drawBezierConstruction(curve);
        }
    }
}

render();