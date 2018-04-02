import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import moment from 'moment';
import styled, { injectGlobal, ThemeProvider } from 'styled-components';

const theme = {
  color: '#fff',
  bgcolor: 'rgb(46, 46, 46)',
  border: '1px solid rgba(139, 139, 139, 0.125)',
  bgcolor2: '#272727',
  bgcolor3: 'rgba(0, 0, 0, 0.1)',
  font: '"IBM Plex Mono", monospace'
};

injectGlobal`
  @import url('https://fonts.googleapis.com/css?family=Gloria+Hallelujah|IBM+Plex+Mono:400,600');

  body {
    background-color: rgb(46, 46, 46);
    color: #fff;
  }

  .list-group {
    list-style-type: none;
  }
`;

const Card = styled.div`
  background-color: ${props => props.theme.bgcolor2};
  border: ${props => props.theme.border};
  color: ${props => props.theme.color};
  margin: 0 auto;
  max-width: 90%;
`;

const CardHeader = styled.div`
  background-color: ${props => props.theme.bgcolor3};
  border-bottom: ${props => props.theme.border};
  cursor: pointer;
  font-weight: 400;
  font-family: ${props => props.theme.font};
  color: ${props => props.theme.color};
  > h3 {
    padding: 15px 0px 15px 15px;
  }
`;

const Status__module = styled.div`
  margin-left: 20px;
  padding: 0 20px;
  width: 500px;
  height: auto;
  :last-child {
    margin-bottom: 30px;
  }
`;

const Status__Item = styled.span`
  display: block;
  margin: 10px 10px;
  font-weight: 400;
  font-family: ${props => props.theme.font};
`;

const Status__ItemTitle = styled.span`
  display: block;
  margin-top: 30px;
  font-size: 18px;
  font-weight: 600;
  font-family: ${props => props.theme.font};
`;

const Bomdia__Item = styled.div`
  font-size: 14px;
  font-weight: 400;
  font-family: ${props => props.theme.font};
  padding: 6px 0;
`;

const Title__bot = styled.div`
  font-family: 'Gloria Hallelujah', cursive;
  font-size: 3.5em;
  margin: 30px auto;
  max-width: 90%;
`;

const Welcome = (props) => {
  return (
    <div>
    <Title__bot>
      <h1>Bom Dia Cracovians Bot</h1>
    </Title__bot>
    </div>
  );
};

const Status = (props) => {
  function validationCalc() {
    const proxData = Math.abs(props.data.proxData);
    const faltam = proxData > 60 ? `${Math.trunc(proxData / 60)} h e ${proxData % 60} min` : `${proxData} min`;
    let returnMessage;
    if (props.data.proxData >= 0) {
      returnMessage = `${props.data.bdc[2]} mensagens`;
    } else {
      returnMessage = faltam;
    }
    return returnMessage;
  }

  if (!props) {
    return (
      <div> Loading ... </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Card>
        <CardHeader id="headingOne" data-toggle="collapse" data-target="#collapseOne"
        aria-expanded="true" aria-controls="collapseOne">
            <h3 className="mb-0"> status </h3>
        </CardHeader>
        <div id="collapseOne" className="collapse show" aria-labelledby="headingOne"
        data-parent="#accordion">
          <Status__module className="card-body">
            <Status__ItemTitle> Bom dia </Status__ItemTitle>
            <Status__Item>Quantidade de Bomdia : {props.data.bdlen} </Status__Item>
            <Status__Item>Quantidade de Gifs : {props.data.giflen} </Status__Item>
            <Status__Item>
              Quantidade de Gifs para validar : {props.data.gifvalidlen}
            </Status__Item>
            <Status__ItemTitle> Não validações </Status__ItemTitle>
            <Status__Item>{`Proximas validações: ${props.data.bdc[0]}`}</Status__Item>
            <Status__Item>{`Intervalo: ${props.data.bdc[1][0]}`}</Status__Item>
            <Status__Item>{`Proxima validação em: ${validationCalc()}`}</Status__Item>
            <Status__Item>
              {`Proxima data : ${moment(props.data.bdc[3]).format('DD / MM / YYYY')}`}
            </Status__Item>
          </Status__module>
        </div>
      </Card>
    </ThemeProvider>
  );
};

const BomdiaItem = ({ value }) => {
  return (
    <Bomdia__Item>
      {`Bom dia, ${value}`}
    </Bomdia__Item>
  );
};

const BomdiaList = (props) => {
  console.log(props.data.bdias.length);
  console.log(props.data.bdias.length > 0);


  function renderlist() {
    let bdias;
    if (props.data.bdias.length > 0) {
      let x = 0;
      bdias = props.data.bdias.map((bomdia, index) => {
        x += bomdia.length;
        const id = `uid_${x}`;
        return (
        <BomdiaItem
          key={id}
          value={bomdia} />
        );
      });
    } else {
      bdias = <div> Loading... </div>;
    }
    return bdias;
  }

  return (
    <ThemeProvider theme={theme}>
      <Card>
        <CardHeader id="headingTwo" data-toggle="collapse" data-target="#collapseTwo"
        aria-expanded="true" aria-controls="collapseTwo">
          <h3 className="mb-0"> ultimos bom dias </h3>
        </CardHeader>
        <div id="collapseTwo" className="collapse show" aria-labelledby="headingTwo"
        data-parent="#accordion">
          <Status__module className="card-body">
            <ul className="list-group">
              {renderlist()}
            </ul>
          </Status__module>
        </div>
      </Card>
    </ThemeProvider>
  );
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {
        bdlen: 0,
        giflen: 0,
        gifvalidlen: 0,
        bdc: [
          [],
          [3, '2018-03-19T19:36:13.000Z', true],
          null,
          '2018-03-11T17:22:06.000Z',
          ['nessaguedes']
        ],
        proxData: 0,
        bdias: [],
      }
    };
  }

  // bomdiacracovians.herokuapp.com
  componentDidMount() {
    const url = 'http://localhost:8080/api';
    axios.get(url)
      .then((data) => {
        this.setState({ data: data.data });
      });
  }

  render() {
    return (
      <div>
        <Welcome />
        <div id="accordion">
          <Status data={this.state.data} />
          <BomdiaList data={this.state.data} />
        </div>
      </div>
    );
  }
}


ReactDOM.render(<App />, document.querySelector('.container'));
