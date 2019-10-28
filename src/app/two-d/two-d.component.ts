import { Component, OnInit } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
// import * as tfvis from '@tensorflow/tfjs-vis';
declare var tfvis: any;

@Component({
  selector: 'app-two-d',
  templateUrl: './two-d.component.html',
  styleUrls: ['./two-d.component.css']
})
export class TwoDComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    run();
  }

}

/**
 * Get the car data reduced to just the variables we are interested
 * and cleaned of missing data.
 */
async function getData() {
  const carsDataReq = await fetch('https://storage.googleapis.com/tfjs-tutorials/carsData.json');
  const carsData = await carsDataReq.json();
  const cleaned = carsData.map(car => ({
    mpg: car.Miles_per_Gallon,
    horsepower: car.Horsepower,
  }))
    .filter(car => (car.mpg != null && car.horsepower != null));

  return cleaned;
}

async function run() {
  // Load and plot the original input data that we are going to train on.
  const data = await getData();
  const values = data.map(d => ({
    x: d.horsepower,
    y: d.mpg,
  }));
  const container = document.getElementById("histogram-cont");

  tfvis.render.scatterplot(
    // { name: 'Horsepower v MPG' },
    container,
    { values },
    {
      xLabel: 'Horsepower',
      yLabel: 'MPG',
      height: 300
    }
  );

  // More code will be added below
  // Create the model
  const model = createModel();
  tfvis.show.modelSummary({ name: 'Model Summary' }, model);

}

function createModel() {
  // Create a sequential model
  const model = tf.sequential();

  // Add a single hidden layer
  model.add(tf.layers.dense({ inputShape: [1], units: 1, useBias: true }));

  // Add an output layer
  model.add(tf.layers.dense({ units: 1, useBias: true }));

  return model;
}