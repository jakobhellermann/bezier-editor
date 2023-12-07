let canvas = document.getElementById("canvas") as HTMLCanvasElement;
let buttonClear = document.getElementById("buttonClear") as HTMLButtonElement;

let optionDepth = document.getElementById("optionDepth") as HTMLInputElement;
let optionLockTangents = document.getElementById("optionLockTangents") as HTMLInputElement;
let optionDepthCurrent = document.getElementById("optionDepthCurrent") as HTMLOutputElement;
let optionColorCurves = document.getElementById("optionColorCurves") as HTMLInputElement;
let optionColorSegments = document.getElementById("optionColorSegments") as HTMLInputElement;
let optionControlPoints = document.getElementById("optionControlPoints") as HTMLInputElement;
let optionShowConstruction = document.getElementById("optionShowConstruction") as HTMLInputElement;
let optionSubdividePoints = document.getElementById("optionSubdividePoints") as HTMLInputElement;
let optionConstructionParameter = document.getElementById("optionConstructionParameter") as HTMLInputElement;
let optionBoundingBoxes = document.getElementById("optionBoundingBoxes") as HTMLInputElement;
let optionConstructionParameterCurrent = document.getElementById("optionConstructionParameterCurrent") as HTMLOutputElement;
let optionMaximumDistance = document.getElementById("optionMaximumDistance") as HTMLInputElement;
let optionMaximumDistanceCurrent = document.getElementById("optionMaximumDistanceCurrent") as HTMLOutputElement;
let optionStopCondition = document.getElementById("optionStopCondition") as HTMLSelectElement;

let nSegmentsOutput = document.getElementById("nSegments") as HTMLOutputElement;

let ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
if (ctx === null) throw new Error("could not get canvas context");

type Point = { x: number; y: number; };
type BezierCurve = Point[];
type Rect = { x: number; y: number; w: number; h: number; };

let distance = (a: Point, b: Point): number => {
    let deltaX = b.x - a.x;
    let deltaY = b.y - a.y;
    let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    return distance;
};

// let initialCurves = [[{ "x": 92, "y": 298 }, { "x": 163, "y": 130 }, { "x": 324, "y": 114 }, { "x": 435, "y": 291 }]];
let initialCurves = [[{ "x": 176, "y": 145 }, { "x": 256, "y": 141 }, { "x": 194, "y": 224 }, { "x": 254, "y": 222 }], [{ "x": 254, "y": 222 }, { "x": 314, "y": 220 }, { "x": 347, "y": 267 }, { "x": 348, "y": 371 }]];

enum StopCondition {
    DEPTH = "DEPTH",
    DISTANCE = "DISTANCE",
    BOUNDING_BOX = "BOUNDING_BOX",
}

// global state:
let curves: BezierCurve[] = initialCurves;
let options = {
    depth: optionDepth.valueAsNumber,
    colorCurves: optionColorCurves.checked,
    colorSegments: optionColorSegments.checked,
    controlPoints: optionControlPoints.checked,
    showConstruction: optionShowConstruction.checked,
    showBoundingBoxes: optionBoundingBoxes.checked,
    constructionParameter: optionConstructionParameter.valueAsNumber,
    showSubdividePoints: optionSubdividePoints.checked,
    maximumDistance: optionMaximumDistance.valueAsNumber,
    stopCondition: optionStopCondition.value,
    lockTangents: optionLockTangents.checked,
};

// event listeners
canvas.addEventListener("click", canvasClick);

optionLockTangents.addEventListener("change", () => {
    options.lockTangents = optionLockTangents.checked;
});
optionColorCurves.addEventListener("change", () => {
    options.colorCurves = optionColorCurves.checked;
    render();
});
optionColorSegments.addEventListener("change", () => {
    options.colorSegments = optionColorSegments.checked;
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
optionSubdividePoints.addEventListener("change", () => {
    options.showSubdividePoints = optionSubdividePoints.checked;
    render();
});
optionBoundingBoxes.addEventListener("change", () => {
    options.showBoundingBoxes = optionBoundingBoxes.checked;
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

optionConstructionParameter.disabled = !options.showConstruction;
optionConstructionParameter.addEventListener("input", () => {
    optionConstructionParameterCurrent.value = optionConstructionParameter.value;
    options.constructionParameter = optionConstructionParameter.valueAsNumber;
    render();
});
optionConstructionParameterCurrent.value = optionConstructionParameter.value;

optionMaximumDistance.addEventListener("input", () => {
    optionMaximumDistanceCurrent.value = optionMaximumDistance.value;
    options.maximumDistance = optionMaximumDistance.valueAsNumber;
    render();
});
optionMaximumDistanceCurrent.value = optionMaximumDistance.value;

optionStopCondition.addEventListener("input", () => {
    options.stopCondition = optionStopCondition.value;
    optionMaximumDistance.disabled = options.stopCondition !== StopCondition.DISTANCE && options.stopCondition !== StopCondition.BOUNDING_BOX;
    optionDepth.disabled = options.stopCondition !== StopCondition.DEPTH;
    render();
});
optionMaximumDistance.disabled = options.stopCondition !== StopCondition.DISTANCE && options.stopCondition !== StopCondition.BOUNDING_BOX;
optionDepth.disabled = options.stopCondition !== StopCondition.DEPTH;

buttonClear.addEventListener("click", () => {
    console.log(JSON.stringify(curves));

    curves = [[]];
    render();
});

// drawing utils
function clear() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

let segmentIndex = 0;
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

function drawBox(box: Rect) {
    ctx.strokeStyle = "pink";
    drawLine({ x: box.x, y: box.y }, { x: box.x + box.w, y: box.y });
    drawLine({ x: box.x, y: box.y + box.h }, { x: box.x + box.w, y: box.y + box.h });
    drawLine({ x: box.x, y: box.y }, { x: box.x, y: box.y + box.h });
    drawLine({ x: box.x + box.w, y: box.y }, { x: box.x + box.w, y: box.y + box.h });
    ctx.strokeStyle = "black";
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

function boundingBox(points: Point[]): Rect {
    let r = -Infinity;
    let l = Infinity;
    let b = -Infinity;
    let t = Infinity;

    for (let point of points) {
        if (point.x > r) r = point.x;
        if (point.x < l) l = point.x;
        if (point.y > b) b = point.y;
        if (point.y < t) t = point.y;
    }

    return { x: l, y: t, w: r - l, h: b - t };
}


function stopCondition(points: BezierCurve, depth: number): boolean {
    if (options.stopCondition === StopCondition.DEPTH) {
        return depth === options.depth;
    } else if (options.stopCondition === StopCondition.DISTANCE) {
        let start = points[0];
        let end = points[points.length - 1];
        return distance(start, end) < options.maximumDistance;
    } else if (options.stopCondition === StopCondition.BOUNDING_BOX) {
        let bb = boundingBox(points);
        if (options.showBoundingBoxes) drawBox(bb);

        let threshold = options.maximumDistance;
        return bb.w <= threshold && bb.h <= threshold;
    } else {
        throw new Error("unknown stop condition");
        return false;
    }
}


let nSegments = 0;

function drawBezierCasteljau(points: BezierCurve, depth = 0) {
    if (points.length <= 1) return;

    if (options.showSubdividePoints) {
        for (const point of points) {
            ctx.fillStyle = distinctColors[depth % distinctColors.length];
            drawPoint(point, 5);
        }
    }

    if (stopCondition(points, depth)) {
        nSegments += 1;
        if (options.colorSegments) {
            ctx.strokeStyle = distinctColors[segmentIndex % distinctColors.length];
            segmentIndex += 1;
        }
        drawLine(points[0], points[points.length - 1]);
    }
    else {
        let intermediates = calculateIntermediates(points, 0.5);

        drawBezierCasteljau(intermediates.map(points => points[0]), depth + 1);
        drawBezierCasteljau(intermediates.map(points => points[points.length - 1]), depth + 1);
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


let event2position = (event: MouseEvent): Point => {
    let rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
};

let hoverPosition: Point | null = null;
let hovered = (pos: Point) => hoverPosition ? distance(pos, hoverPosition) < 5 : false;;

type CurvePointIndex = { curve: number, point: number; };

let dragging = false;
let draggingPoint: CurvePointIndex | null = null;

let lastSelectedPoint: CurvePointIndex | null = null;

canvas.addEventListener("mousedown", (event) => {
    if (options.controlPoints) {
        for (let i = 0; i < curves.length; i++) {
            let curve = curves[i];
            for (let j = 0; j < curve.length; j++) {
                let point = curve[j];
                if (hovered(point)) {
                    draggingPoint = { curve: i, point: j };
                    dragging = true;
                    lastSelectedPoint = { curve: i, point: i };
                    return;
                }
            }
        }
    }
});


canvas.addEventListener("mousemove", (event: MouseEvent) => {
    hoverPosition = event2position(event);

    if (draggingPoint) {
        moveCurvePoint(draggingPoint, hoverPosition);
    }

    render();
});

function moveCurvePoint(curvePoint: CurvePointIndex, to: Point) {
    let curve = curves[curvePoint.curve];
    let point = curve[curvePoint.point];

    let deltaX = to.x - point.x;
    let deltaY = to.y - point.y;

    point.x = to.x;
    point.y = to.y;

    // adjust startpoint
    if (curvePoint.point === 0 && curvePoint.curve > 0) {
        let prevCurve = curves[curvePoint.curve - 1];
        let prevLast = prevCurve.at(-1)!;
        prevLast.x = point.x;
        prevLast.y = point.y;

        if (curve.length > 2) {
            let thisControl = curve[1]!;
            thisControl.x += deltaX;
            thisControl.y += deltaY;
        }
        if (prevCurve.length > 2) {
            let prevControl = prevCurve.at(-2)!;
            prevControl.x += deltaX;
            prevControl.y += deltaY;
        }
    }
    // adjust endpoint
    else if (curvePoint.point === curve.length - 1 && curvePoint.curve < curves.length - 1) {
        let nextCurve = curves[curvePoint.curve + 1];
        let nextFirst = nextCurve[0];
        if (nextFirst) {
            nextFirst.x = point.x;
            nextFirst.y = point.y;
        }

        if (curve.length > 2) {
            let thisControl = curve.at(-2)!;
            thisControl.x += deltaX;
            thisControl.y += deltaY;
        }

        if (nextCurve.length > 2) {
            let nextControl = nextCurve[1];
            nextControl.x += deltaX;
            nextControl.y += deltaY;
        }
    }

    if (options.lockTangents) {
        // move first control
        if (curvePoint.point === 1 && curvePoint.curve > 0) {
            let prevCurve = curves[curvePoint.curve - 1];
            if (prevCurve.length > 2) {
                let shared = prevCurve.at(-1)!;
                let prevControl = prevCurve.at(-2)!;
                let tangent = { x: shared.x - point.x, y: shared.y - point.y };
                prevControl.x = shared.x + tangent.x;
                prevControl.y = shared.y + tangent.y;
            }
        }
        // move last control
        else if (curvePoint.point === curve.length - 2 && curvePoint.curve < curves.length - 1) {
            let nextCurve = curves[curvePoint.curve + 1];
            if (nextCurve.length > 2) {
                let shared = nextCurve[0];
                let nextControl = nextCurve[1];
                let tangent = { x: shared.x - point.x, y: shared.y - point.y };
                nextControl.x = shared.x + tangent.x;
                nextControl.y = shared.y + tangent.y;
            }
        }
    }
}

canvas.addEventListener("mouseup", (event) => {
    draggingPoint = null;
});


function canvasClick(event: MouseEvent) {
    if (dragging) {
        dragging = dragging && draggingPoint !== null;
        return;
    }

    lastSelectedPoint = addPoint(event2position(event), event.shiftKey);
    render();
}

function addPoint(point: Point, inNewCurve: boolean): CurvePointIndex {
    if (curves.length === 0) curves.push([]);

    if (inNewCurve) {
        if (curves[curves.length - 1].length > 1) {
            let lastCurve = curves[curves.length - 1];
            let lastPoint = lastCurve[lastCurve.length - 1];

            let lastControlPoint = lastCurve[lastCurve.length - 2];
            let tangent = { x: lastPoint.x - lastControlPoint.x, y: lastPoint.y - lastControlPoint.y };
            let newControlPoint = { x: lastPoint.x + tangent.x, y: lastPoint.y + tangent.y };

            curves.push([lastPoint, newControlPoint]);
        }
    }
    curves[curves.length - 1].push(point);

    return { curve: curves.length - 1, point: curves[curves.length - 1].length - 1 };

}

let distinctColors = ["#191970", "#f064ff", "#ff0000", "#00ff00", "#00ffff", "#ff00ff", "#ffb6c1"];
function render() {
    segmentIndex = 0;
    clear();

    nSegments = 0;
    for (let i = 0; i < curves.length; i++) {
        let curve = curves[i];
        if (options.controlPoints) {
            ctx.fillStyle = "#000000";
            for (let j = 0; j < curve.length; j++) {
                let point = curve[j];
                drawPoint(point, hovered(point) ? 10 : 4);
            }

            if (curve.length > 1) {
                ctx.strokeStyle = "#999";
                ctx.lineWidth = 0.5;
                drawLine(curve[0], curve[1]);
                if (curve.length > 2) {
                    drawLine(curve[curve.length - 1], curve[curve.length - 2]);
                }
            }
        }

        if (options.colorCurves) ctx.strokeStyle = distinctColors[i % distinctColors.length];
        else ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;

        drawBezierCasteljau(curve);

        if (options.showConstruction) {
            drawBezierConstruction(curve);
        }
    }
    nSegmentsOutput.textContent = nSegments.toString();
}

render();

document.addEventListener("keyup", event => {
    if (event.key === "Delete") {
        if (lastSelectedPoint) removePoint(lastSelectedPoint);
    }
});

function removePoint(point: CurvePointIndex) {
    // TODO: remove point at index

    if (curves.length > 0) {
        let curve = curves[curves.length - 1];
        if (curve.length > 0) {
            curve.pop();
        }
        // single point doesn't make a lot of sense
        if (curve.length === 1) curve.pop();

        if (curve.length === 0) {
            curves.pop();
        }
        render();
    }
}