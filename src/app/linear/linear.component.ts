import * as tf from '@tensorflow/tfjs';
import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
interface Point2d { x: number; y: number; }
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
  scaledPoints: Point2d[] = [];
  m0: tf.Variable<tf.Rank.R0>;
  b0: tf.Variable<tf.Rank.R0>;

  a: tf.Variable<tf.Rank.R0> = tf.variable(tf.scalar(Math.random()));
  b: tf.Variable<tf.Rank.R0> = tf.variable(tf.scalar(Math.random()));
  c: tf.Variable<tf.Rank.R0> = tf.variable(tf.scalar(Math.random()));

  learningRate = 0.2;
  optimizer = tf.train.sgd(this.learningRate);
  exp = 2;
  variables: tf.Variable<tf.Rank.R0>[] = [];
  loss = (pred, label) => pred.sub(label).square().mean();
  predict = (xs) => tf.tensor1d(xs).mul(this.m0).add(this.b0);
  // y=ax^2+bx^1+cx^0
  // y=ax^2+bx+c
  predictPolynomial2 = (xs) => tf.tensor1d(xs).square().mul(this.a).add(tf.tensor1d(xs).mul(this.b)).add(this.c);
  predictPolynomial = (xs, exp) => {
    let res = xs.pow(exp).mul(this.variables[0]);
    for (let index = 1; index <= this.exp; index++) {
      res = res.add(xs.pow(exp.sub(index)).mul(this.variables[index]));
    }
    return res;
  }
  constructor() {
    for (let index = 0; index <= this.exp; index++) {
      this.variables.push(tf.variable(tf.scalar(Math.random())));
    }
  }
  ngAfterViewInit(): void {
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.height = +this.canvas.nativeElement.getAttribute('height');
    this.width = +this.canvas.nativeElement.getAttribute('width');
    this.ctx.fillStyle = 'rgba(1,1,1,1)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.m0 = tf.variable(tf.scalar(Math.random()));
    this.b0 = tf.variable(tf.scalar(Math.random()));

    setInterval(() => this.draw(), 30);

  }

  onCanvasClick(event) {
    const mousePos = getMousePos(this.canvas.nativeElement, event);
    const scaledPoint: Point2d = {
      y: scale(mousePos.y, 0, this.height, 1, -1),
      x: scale(mousePos.x, 0, this.width, -1, 1)
    };
    this.scaledPoints.push(scaledPoint);
    const naturX = scale(scaledPoint.x, -1, 1, 0, this.width);
    const naturY = scale(scaledPoint.y, -1, 1, this.height, 0);
    this.draw();

  }

  draw() {

    if (this.scaledPoints.length > 0) {
      tf.tidy(() => {
        this.trainingStepPolynomial().then(({ curveXs, curveYs }) => {
          this.ctx.fillRect(0, 0, this.width, this.height);
          this.ctx.strokeStyle = 'rgba(200,200,1,1)';
          this.scaledPoints.forEach((point) => {
            this.drawPoint(point.x, point.y, 8);
          });
          this.ctx.lineWidth = 2;

          const naturXs = curveXs.map(x => scale(x, -1, 1, 0, this.width));
          const naturYs = curveYs.map(y => scale(y, -1, 1, this.height, 0));

          for (let index = 1; index < naturXs.length; index++) {
            this.ctx.moveTo(naturXs[index - 1], naturYs[index - 1]);
            this.ctx.lineTo(naturXs[index], naturYs[index]);
            this.ctx.stroke();
          }
        });
      });

    }
  }

  trainingStep() {

    const ys = tf.tensor1d(this.scaledPoints.map(p => p.y));
    this.optimizer.minimize(() => this.loss(this.predict(this.scaledPoints.map(p => p.x)), ys));
    const xs = [-1, 1];
    const lineYs = this.predict(xs);
    const x1 = scale(xs[0], -1, 1, 0, this.width);
    const x2 = scale(xs[1], -1, 1, 0, this.width);
    return lineYs.data().then(data => {
      const y1 = scale(data[0], -1, 1, this.height, 0);
      const y2 = scale(data[1], -1, 1, this.height, 0);

      // console.log(this.m.toString(), tf.memory().numTensors);
      return { x1, x2, y1, y2 };
    });

  }

  trainingStepPolynomial() {

    const curveXs = [];
    for (let x = -1; x < 1.1; x += 0.05) {
      curveXs.push(x);
    }
    const ys = tf.tensor1d(this.scaledPoints.map(p => p.y));

    this.optimizer.minimize(() => this.loss(this.predictPolynomial(
      tf.tensor1d(this.scaledPoints.map(p => p.x)),
      tf.scalar(this.exp)
    ), ys));
    const curveYsRaw = this.predictPolynomial(
      tf.tensor1d(curveXs),
      tf.scalar(this.exp)
    );
    return curveYsRaw.data().then(curveYs => {
      // console.log(curveYs);
      return { curveXs, curveYs };
    });

  }

  drawPoint(x, y, lineWidth: number = this.ctx.lineWidth) {
    const naturX = scale(x, -1, 1, 0, this.width);
    const naturY = scale(y, -1, 1, this.height, 0);
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.lineCap = 'round';
    this.ctx.moveTo(naturX, naturY);
    this.ctx.lineTo(naturX, naturY);
    this.ctx.stroke();
  }

}

function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

function scale(x: number, xMin: number, xMax: number, scaledXMin: number, scaledXMax: number) {
  const scaleFakrtor = (scaledXMax - scaledXMin) / (xMax - xMin);
  return scaleFakrtor * (x - xMin) + scaledXMin;
}
