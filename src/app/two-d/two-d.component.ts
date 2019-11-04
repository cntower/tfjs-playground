import { Component, OnInit } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';

@Component({
  selector: 'app-two-d',
  templateUrl: './two-d.component.html',
  styleUrls: ['./two-d.component.css']
})
export class TwoDComponent implements OnInit {

  model;
  data;
  tensorData;

  constructor() { }

  ngOnInit() {
    this.run()
      .then(({ model, data, tensorData }) => {
        this.model = model;
        this.data = data;
        this.tensorData = tensorData;
      });
  }

  async run() {
    // Load and plot the original input data that we are going to train on.
    // const data: { horsepower: number, mpg: number }[] = await getData();
    const data: { horsepower: number, mpg: number }[] = [
      { horsepower: 1, mpg: 1 },
      { horsepower: 2, mpg: 2 },
      { horsepower: 3, mpg: 3 },
      { horsepower: 4, mpg: 4 },
      { horsepower: 5, mpg: 5 }

    ];
    plotData(data);

    // More code will be added below
    // Create the model
    const model = createModel();
    tfvis.show.modelSummary({ name: 'Model Summary' }, model);

    // Convert the data to a form we can use for training.
    const tensorData = convertToTensor(data);
    const { inputs, labels } = tensorData;

    // Train the model
    await this.trainModel(model, inputs, labels);
    console.log('Done Training');
    const saveResults = await model.save('localstorage://my-model-1');

    return { model, data, tensorData };
  }

  async trainModel(model, inputs, labels) {
    // Prepare the model for training.
    model.compile({
      optimizer: tf.train.adam(),
      loss: tf.losses.meanSquaredError,
      metrics: ['mse'],
    });

    const batchSize = 5;
    const epochs = 50;

    return await model.fit(inputs, labels, {
      batchSize,
      epochs,
      shuffle: false,
      callbacks: tfvis.show.fitCallbacks(
        { name: 'Training Performance' },
        ['loss', 'mse'],
        { height: 200, callbacks: ['onEpochEnd'] }
      )
    });
  }

  // Make some predictions using the model and compare them to the
  // original data
  testModel(model, inputData, normalizationData) {
    const { inputMax, inputMin, labelMin, labelMax } = normalizationData;

    // Generate predictions for a uniform range of numbers between 0 and 1;
    // We un-normalize the data by doing the inverse of the min-max scaling
    // that we did earlier.
    const [xs, preds] = tf.tidy(() => {

      // tslint:disable-next-line: variable-name
      const _xs = tf.linspace(0, 1, 10);
      // tslint:disable-next-line: variable-name
      const _preds = model.predict(_xs.reshape([10, 1]));
      const unNormXs = _xs
        .mul(inputMax.sub(inputMin))
        .add(inputMin);

      const unNormPreds = _preds
        .mul(labelMax.sub(labelMin))
        .add(labelMin);
      console.log(unNormPreds.dataSync(), unNormXs.dataSync());

      // Un-normalize the data
      return [unNormXs.dataSync(), unNormPreds.dataSync()];
    });


    const predictedPoints = Array.from(xs).map((val, i) => {
      return { x: val, y: preds[i] };
    });

    const originalPoints = inputData.map(d => ({
      x: d.horsepower, y: d.mpg,
    }));


    tfvis.render.scatterplot(
      { name: 'Model Predictions vs Original Data' },
      { values: [originalPoints, predictedPoints], series: ['original', 'predicted'] },
      {
        xLabel: 'Horsepower',
        yLabel: 'MPG',
        height: 300
      }
    );
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

function plotData(data: { horsepower: number, mpg: number }[]) {
  const values: { x: number, y: number }[] = data.map((d) => ({
    x: d.horsepower,
    y: d.mpg,
  }));
  const container = document.getElementById('histogram-cont');
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
}

function createModel() {
  // Create a sequential model
  const model = tf.sequential();

  // Add hidden layers
  model.add(tf.layers.dense({ inputShape: [1], units: 1, useBias: true }));
  // model.add(tf.layers.dense({ inputShape: [50], units: 1, activation: 'sigmoid' }));

  // Add an output layer
  model.add(tf.layers.dense({ units: 1, useBias: true }));

  return model;
}

/**
 * Convert the input data to tensors that we can use for machine
 * learning. We will also do the important best practices of _shuffling_
 * the data and _normalizing_ the data
 * MPG on the y-axis.
 */
function convertToTensor(data) {
  // Wrapping these calculations in a tidy will dispose any
  // intermediate tensors.

  return tf.tidy(() => {
    // Step 1. Shuffle the data
    tf.util.shuffle(data);

    // Step 2. Convert data to Tensor
    const inputs = data.map(d => d.horsepower);
    const labels = data.map(d => d.mpg);

    const inputTensor = tf.tensor2d(inputs, [inputs.length, 1]);
    inputTensor.print();
    const labelTensor = tf.tensor2d(labels, [labels.length, 1]);

    // Step 3. Normalize the data to the range 0 - 1 using min-max scaling
    const inputMax = inputTensor.max();
    const inputMin = inputTensor.min();
    const labelMax = labelTensor.max();
    const labelMin = labelTensor.min();

    const normalizedInputs = inputTensor.sub(inputMin).div(inputMax.sub(inputMin));
    const normalizedLabels = labelTensor.sub(labelMin).div(labelMax.sub(labelMin));

    return {
      inputs: normalizedInputs,
      labels: normalizedLabels,
      // Return the min/max bounds so we can use them later.
      inputMax,
      inputMin,
      labelMax,
      labelMin,
    };
  });
}
