import * as tf from '@tensorflow/tfjs';
import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-linear',
  templateUrl: './linear.component.html',
  styleUrls: ['./linear.component.css']
})
export class LinearComponent implements AfterViewInit {

  @ViewChild('canvas', { static: true }) canvas !: ElementRef<HTMLCanvasElement>;
  ctx: CanvasRenderingContext2D;
  height: number;
  width: number;
  scaledPoints: { x: number, y: number }[] = [];
  m: tf.Variable<tf.Rank.R0>;
  b: tf.Variable<tf.Rank.R0>;
  learningRate = 0.1;
  optimizer = tf.train.sgd(this.learningRate);
  loss = (pred, label) => pred.sub(label).square().mean();

  constructor() { }
  ngAfterViewInit(): void {
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.height = +this.canvas.nativeElement.getAttribute('height');
    this.width = +this.canvas.nativeElement.getAttribute('width');
    this.ctx.fillStyle = 'rgba(1,1,1,1)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.m = tf.variable(tf.scalar(Math.random()));
    this.b = tf.variable(tf.scalar(Math.random()));

    setInterval(() => this.draw(), 30);

  }

  onCanvasClick(event) {
    const mousePos = getMousePos(this.canvas.nativeElement, event);
    this.scaledPoints.push({
      y: scale(mousePos.y, 0, this.height, 1, 0),
      x: scale(mousePos.x, 0, this.width, 0, 1)
    });
    this.draw();

  }

  draw() {

    if (this.scaledPoints.length > 0) {
      tf.tidy(() => {
        this.trainingStep().then((line) => {
          this.ctx.fillRect(0, 0, this.width, this.height);
          this.ctx.strokeStyle = 'rgba(200,200,1,1)';
          this.scaledPoints.forEach((point) => {
            this.drawPoint(point.x, point.y, 8);
          });
          this.ctx.lineWidth = 3;
          this.ctx.moveTo(line.x1, line.y1);
          this.ctx.lineTo(line.x2, line.y2);
          this.ctx.stroke();
        });
      });

    }
  }

  trainingStep() {

    const ys = tf.tensor1d(this.scaledPoints.map(p => p.y));
    this.optimizer.minimize(() => this.loss(this.predict(this.scaledPoints.map(p => p.x)), ys));
    const xs = [0, 1];
    const lineYs = this.predict(xs);
    const x1 = scale(xs[0], 0, 1, 0, this.width);
    const x2 = scale(xs[1], 0, 1, 0, this.width);
    return lineYs.data().then(data => {
      const y1 = scale(data[0], 0, 1, this.height, 0);
      const y2 = scale(data[1], 0, 1, this.height, 0);

      // console.log(this.m.toString(), tf.memory().numTensors);
      return { x1, x2, y1, y2 };
    });

  }

  drawPoint(x, y, lineWidth: number = this.ctx.lineWidth) {
    const naturX = scale(x, 0, 1, 0, this.width);
    const naturY = scale(y, 0, 1, this.height, 0);
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.lineCap = 'round';
    this.ctx.moveTo(naturX, naturY);
    this.ctx.lineTo(naturX, naturY);
    this.ctx.stroke();
  }

  predict(xs) {
    const tfys = tf.tensor1d(xs).mul(this.m).add(this.b);
    return tfys;
  }

}


// Get Mouse Position
// tslint:disable-next-line: no-shadowed-variable
function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

function scale(x: number, xMin: number, xMax: number, scaledXMin: number, scaledXMax: number) {
  const scaleFakrtor = (scaledXMax - scaledXMin) / (xMax - xMin);
  return scaleFakrtor * x + scaledXMin;
}
