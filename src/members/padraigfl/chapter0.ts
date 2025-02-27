import p5 from "p5";

type HSLA = {
  h: number;
  s: number;
  l: number;
  a: number;
};

interface NodeParams {
  fill: Partial<HSLA>; // lets do hsla for a change
  stroke: Partial<HSLA>;
  strokeWeight: number;
  width: number;
  height: number;
  x: number;
  y: number;
}

const defaultHsla = {
  h: 0, s: 0, l: 0, a: 100,
}

abstract class P5Node {
  protected fill: HSLA; // lets do hsla for a change
  protected stroke: HSLA;
  strokeWeight: number;
  width: number;
  height: number;
  x: number;
  y: number;
  constructor(params: NodeParams) {
    this.fill = { ...defaultHsla, ...params.fill };
    this.stroke = { ...defaultHsla, ...params.stroke};
    this.strokeWeight = params.strokeWeight;
    this.height = params.height;
    this.width = params.width;
    this.x = params.x;
    this.y = params.y;
  };
  private getHsla = (param: HSLA) => `hsla(${param.h},${param.s}%,${param.l}%,${param.a})`
  setFill = (color: Partial<HSLA>) => {
    this.fill = {...this.fill, ...color };
  }
  getFill = () => this.getHsla(this.fill);
  getStroke = () => this.getHsla(this.stroke);
}

export function sketch0(p5: p5, options: any) {
  const canvasSize = { width: options?.canvasWidth || 600, height: options?.canvasHeight || 600 };


  // a crude class for trailing behind the original walker
  class Trailer extends P5Node {
    prevStates: { x: number, y: number, }[];
    delay: number;
    constructor(params: NodeParams & { delay: number}) {
      super(params);
      this.prevStates = [];
      this.delay = params.delay
    }
    move = () => {
      const { x, y } = this.prevStates.shift() || {};
      console.log(x, y)
      this.x = x || this.x;
      this.y = y || this.y;
    }
    show = () => {
      p5.fill(this.getFill());
      p5.strokeWeight(this.strokeWeight);
      p5.stroke(this.getStroke());
      p5.ellipse(this.x, this.y, this.width, this.height);
    }
    update = (x: number, y: number) => {
      if (this.prevStates.length > this.delay) {
        this.move();
        this.show();
      }
      console.log(this.prevStates.length)
      this.prevStates.push({ x, y });
    }
  }

  class Walker extends P5Node {
    trailers = [
      new Trailer({
        stroke: { l: 20, a: 0.5},
        fill: { l: 0 },
        strokeWeight: 2,
        width: 38,
        height: 38,
        x: 150,
        y: 150,
        delay: 10,
      }),
      new Trailer({
        stroke: { l: 0,},
        fill: { l: 0, a: 0 },
        strokeWeight: 2,
        width: 38,
        height: 38,
        x: 150,
        y: 150,
        delay: 100,
      }),
    ]
    move = () => {
      let choice = p5.floor(p5.random(4));
      let steps = p5.floor(p5.random(10));
      if (choice === 0) {
        this.x+=steps;
      } else if (choice === 1) {
        this.x-=steps;
      } else if (choice === 2) {
        this.y+=steps;
      } else {
        this.y-=steps;
      }
      if (this.x < 0 || this.x > canvasSize.width) {
        const rangeStart = p5.floor(canvasSize.width / 3);
        this.x = p5.floor(p5.random(rangeStart, rangeStart*2));
      }
      if (this.y < 0 || this.y > canvasSize.height) {
        const rangeStart = p5.floor(canvasSize.height / 3);
        this.y = p5.floor(p5.random(rangeStart, rangeStart*2));
      }
    }
    colorChange = () => {
      let choice = p5.floor(p5.random(10));
      if (choice > 8) {
        this.fill.h = (++this.fill.h % 360);
      }
      if (choice < 1) {
        this.stroke.h = ((this.stroke.h + 359) % 360)
      }
    }
    show = () => {
      p5.fill(this.getFill());
      p5.strokeWeight(this.strokeWeight);
      p5.stroke(this.getStroke());
      p5.ellipse(this.x, this.y, this.width, this.height);
    }
    update = () => {
      this.move()
      this.colorChange();
      this.show()
      this.trailers.forEach(trailer => trailer.update(this.x, this.y));
    }
  }

  const w = new Walker({
    fill: { h: p5.floor(p5.random(0, 360)), s: 60, l: 50, a: 1 },
    stroke: { h: p5.floor(p5.random(0, 360)), s: 60, l: 50, a: 1 },
    strokeWeight: 5,
    width: 40,
    height: 40,
    x: 300,
    y: 300,
  });

  p5.setup = () => {
    p5.createCanvas(canvasSize.width, canvasSize.height);
    p5.background("black");
  }
  p5.draw = () => {
    w.update();
  }
}
