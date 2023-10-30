let canvas = document.getElementById("canvas")! as HTMLCanvasElement;
let ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
if (ctx === null) throw new Error("could not get canvas context");

type Point = { x: number; y: number; };
type BezierCurve = Point[];

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
    curve.push({ x: event.clientX, y: event.clientY });
    render();
}


let curve: BezierCurve = [];

function render() {
    clear();

    drawBezierCasteljau(curve);
    for (let i = 0; i < curve.length; i++) {
        drawPoint(curve[i]);

        /*if (i != points.length - 1) {
            let from = points[i];
            let to = points[i + 1];
            drawLine(from, to);
        }*/
    }

}

