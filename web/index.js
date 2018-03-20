import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import moment from 'moment';

const Welcome = (props) => {
  return (
    <div className="title__bot">
      <h1>Bom Dia Cracovians Bot</h1>
    </div>
  );
}

class Status extends Component {
  constructor(props){
    super(props),
      this.state = { data: {
        bdlen: 0,
        giflen: 0,
        gifvalidlen: 0,
        bdc: [
          [],
          [3, "2018-03-19T19:36:13.000Z", true],
          null,
          "2018-03-11T17:22:06.000Z",
          ["nessaguedes"]
        ],
        proxData: 0
      }};
  }


  componentDidMount () {
    const url = `https://bomdiacracovians.herokuapp.com/api/length`;
    axios.get(url)
      .then((data) => {
        this.setState({data: data.data});
        console.log(this.state.data);

      }) ;
  }

  render() {
    const proxData = this.state.data.proxData;
    const faltam = proxData > 60 ? `${Math.round(proxData / 60)} h e ${proxData % 60} min` : `${proxData} min`;
    return (
        <div className="card">
          <div className="card-header" id="headingOne" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
              <h3 className="mb-0"> status </h3>
          </div>
          <div id="collapseOne" className="collapse show" aria-labelledby="headingOne" data-parent="#accordion">
            <div className="status__module card-body">
              <span className="status__itemTitle"> Bom dia </span>
              <span className="status__item">Quantidade de Bomdia : {this.state.data.bdlen} </span>
              <span className="status__item">Quantidade de Gifs : {this.state.data.giflen} </span>
              <span className="status__item">Quantidade de Gifs para validar : {this.state.data.gifvalidlen} </span>
              <span className="status__itemTitle"> Não validações </span>
              <span className="status__item">{`Proximas validações: ${this.state.data.bdc[0]}`}</span>
              <span className="status__item">{`Intervalo: ${this.state.data.bdc[1][0]}`}</span>
              <span className="status__item">{`Proxima validação em: ${faltam}`}</span>
              <span className="status__item">
                {`Proxima data : ${moment(this.state.data.bdc[3]).format('DD / MM / YYYY')}`}
              </span>
            </div>
          </div>
        </div>

    );
  }
}

const BomdiaItem = ({value}) => {
  return (
    <li className="bomdia__item">
      {`Bom dia ${value}`}
    </li>
  );
}

class BomdiaList extends Component {
  constructor(props) {
    super(props),
      this.state = {};
  }


  componentDidMount() {
    const url = `https://bomdiacracovians.herokuapp.com/api/bdias`;
    axios.get(url)
      .then((data) => {
        this.setState({ bdias: data.data.bdias });
      });
  }

  renderlist () {
    if (this.state.bdias) {
      let x = 0;
      const bdias = this.state.bdias.map((bomdia, index) => {
        x += bomdia.length;
        const id = `uid_${x}`;
        return (
        <BomdiaItem
            key={id}
          value={bomdia} />
        );
      });
      return bdias;
    }
  }

  render() {
    return (
      <div className="card">
        <div className="card-header" id="headingTwo" data-toggle="collapse" data-target="#collapseTwo" aria-expanded="true" aria-controls="collapseTwo">
          <h3 className="mb-0"> ultimos bom dias </h3>
        </div>
        <div id="collapseTwo" className="collapse show" aria-labelledby="headingTwo" data-parent="#accordion">
          <div className="status__module card-body">
            <ul className="list-group">
              {this.renderlist()}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

function App() {
    return (
      <div>
        <Welcome />
        <div id="accordion">
          <Status />
          <BomdiaList />
        </div>
      </div>
  );
}


ReactDOM.render(<App />, document.querySelector('.container'));
