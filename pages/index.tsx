import React from 'react';
import { Grid, Button, Typography, Card, CardContent, CardActions, LinearProgress } from '@material-ui/core';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes } from "react-router-dom";
import TopLayout from './components/TopLayout';
import { ReactNotifications } from 'react-notifications-component'
import { ConfigProvider, theme } from 'antd';
import { Link } from '../routes';


import web3 from '../libs/web3';
import Project from '../libs/project';
import ProjectList from '../libs/projectList';
import withRoot from '../libs/withRoot';
import Layout from '../components/Layout';
import InfoBlock from '../components/InfoBlock';


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(

  <BrowserRouter>
    <ReactNotifications />
    <ConfigProvider
      theme={{
        //  algorithm: theme.compactAlgorithm ,

      }}
    >
      <TopLayout />
    </ConfigProvider>
  </BrowserRouter>

);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();


class Index extends React.Component {
  static async getInitialProps({ req }) {
    const addressList = await ProjectList.methods.getProjects().call();
    const summaryList = await Promise.all(
      addressList.map(address =>
        Project(address)
          .methods.getSummary()
          .call()
      )
    );
    console.log({ summaryList });
    const projects = addressList.map((address, i) => {
      const [description, minInvest, maxInvest, goal, balance, investorCount, paymentCount, owner] = Object.values(
        summaryList[i]
      );

      return {
        address,
        description,
        minInvest,
        maxInvest,
        goal,
        balance,
        investorCount,
        paymentCount,
        owner,
      };
    });

    console.log(projects);

    return { projects };
  }

  render() {
    const { projects } = this.props;

    return (
      <Layout>
        <Grid container spacing={16}>
          {projects.length === 0 && <p>Don't have a project yet, go create one!</p>}
          {projects.length > 0 && projects.map(this.renderProject)}
        </Grid>
      </Layout>
    );
  }

  renderProject(project) {
    const progress = project.balance / project.goal * 100;

    return (
      <Grid item md={6} key={project.address}>
        <Card>
          <CardContent>
            <Typography gutterBottom variant="headline" component="h2">
              {project.description}
            </Typography>
            <LinearProgress style={{ margin: '10px 0' }} color="primary" variant="determinate" value={progress} />
            <Grid container spacing={16}>
              <InfoBlock title={`${web3.utils.fromWei(project.goal, 'ether')} ETH`} description="Fundraising Cap" />
              <InfoBlock title={`${web3.utils.fromWei(project.minInvest, 'ether')} ETH`} description="Minimum Investment Amount" />
              <InfoBlock title={`${web3.utils.fromWei(project.maxInvest, 'ether')} ETH`} description="Maximum Investment Amount" />
              <InfoBlock title={`${project.investorCount}person`} description="Number of participants" />
              <InfoBlock title={`${web3.utils.fromWei(project.balance, 'ether')} ETH`} description=" Amount of funds raised" />
            </Grid>
          </CardContent>
          <CardActions>
            <Link route={`/projects/${project.address}`}>
              <Button size="small" color="primary">
                Invest Now
              </Button>
            </Link>
            <Link route={`/projects/${project.address}`}>
              <Button size="small" color="secondary">
                View Details
              </Button>
            </Link>
          </CardActions>
        </Card>
      </Grid>
    );
  }
}

export default withRoot(Index);
