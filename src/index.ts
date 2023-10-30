let canvas = document.getElementById("canvas") as HTMLCanvasElement;
let optionDepth = document.getElementById("optionDepth") as HTMLInputElement;
let optionColorCurves = document.getElementById("optionColorCurves") as HTMLInputElement;
let optionControlPoints = document.getElementById("optionControlPoints") as HTMLInputElement;

let ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
if (ctx === null) throw new Error("could not get canvas context");

type Point = { x: number; y: number; };
type BezierCurve = Point[];

// global state:
let curves: BezierCurve[] = [[]];

function clear() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawLine(from: Point, to: Point) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
}

function drawPoint(from: Point) {
    let size = 4;
    ctx.rect(from.x - size / 2, from.y - size / 2, size, size);
    ctx.fill();
}

function reduceToHalfwayPoints(points: Point[]) {
    return Array.from({ length: points.length - 1 }, (_, i) => {
        let from = points[i];
        let to = points[i + 1];
        return { x: 0.5 * (from.x + to.x), y: 0.5 * (from.y + to.y) };
    });
}
function drawBezierCasteljau(points: BezierCurve, depth = 5) {
    if (depth === 0) drawLine(points[0], points[points.length - 1]);
    else {
        let intermediates = [points];
        for (let i = 1; i < points.length; i++) {
            let reduced = reduceToHalfwayPoints(intermediates[i - 1]);
            intermediates.push(reduced);
        }

        drawBezierCasteljau(intermediates.map(points => points[0]), depth - 1);
        drawBezierCasteljau(intermediates.map(points => points[points.length - 1]), depth - 1);
    }

}


canvas.addEventListener("click", onClickHandler);

function onClickHandler(event: MouseEvent) {
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

let distinctColors = ["#191970", "#006400", "#ff0000", "#ffd700", "#00ff00", "#00ffff", "#ff00ff", "#ffb6c1"];
function render() {
    clear();
    for (let i = 0; i < curves.length; i++) {
        let curve = curves[i];
        for (const point of curve) drawPoint(point);

        ctx.strokeStyle = distinctColors[i % distinctColors.length];
        drawBezierCasteljau(curve);
    }
}

