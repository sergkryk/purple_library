export default class AbstractNode {
  constructor(node, nodeClasses) {
    this.classList = nodeClasses;
    this.node = document.createElement(node);
    this.node.classList.add(...this.classList);
  }

  create() {
    return this.node;
  }
}