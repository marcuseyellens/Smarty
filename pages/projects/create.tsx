import React from 'react';
import { Grid, Button, Typography, TextField, Paper, CircularProgress } from '@material-ui/core';

import { Link } from '../../routes';
import web3 from '../../libs/web3';
import ProjectList from '../../libs/projectList';
import withRoot from '../../libs/withRoot';
import Layout from '../../components/home-comp/Layout';

class ProjectCreate extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      description: '',
      minInvest: 0,
      maxInvest: 0,
      goal: 0,
      errmsg: '',
      loading: false,
    };

    this.onSubmit = this.createProject.bind(this);
  }

  getInputHandler(key) {
    return e => {
      console.log(e.target.value);
      this.setState({ [key]: e.target.value });
    };
  }

  async createProject() {
    const { description, minInvest, maxInvest, goal } = this.state;
    console.log(this.state);

    // Field Compliance Checks
    if (!description) {
      return this.setState({ errmsg: 'The project name cannot be empty' });
    }
    if (minInvest <= 0) {
      return this.setState({ errmsg: 'The minimum investment amount for the project must be greater than 0' });
    }
    if (maxInvest <= 0) {
      return this.setState({ errmsg: 'Maximum project investment amount must be greater than 0' });
    }
    if (maxInvest < minInvest) {
      return this.setState({ errmsg: 'Minimum project investment amount must be less than the maximum investment amount' });
    }
    if (goal <= 0) {
      return this.setState({ errmsg: 'Project fundraising cap must be greater than 0' });
    }

    const minInvestInWei = web3.utils.toWei(minInvest, 'ether');
    const maxInvestInWei = web3.utils.toWei(maxInvest, 'ether');
    const goalInWei = web3.utils.toWei(goal, 'ether');

    try {
      this.setState({ loading: true, errmsg: '' });

      // Getting an account
      const accounts = await web3.eth.getAccounts();
      const owner = accounts[0];

      // Create a project
      const result = await ProjectList.methods
        .createProject(description, minInvestInWei, maxInvestInWei, goalInWei)
        .send({ from: owner, gas: '5000000' });

      this.setState({ errmsg: 'Project Created Successfully' });
      console.log(result);

      setTimeout(() => {
        location.href = '/projects';
      }, 1000);
    } catch (err) {
      console.error(err);
      this.setState({ errmsg: err.message || err.toString });
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    return (
      <Layout>
        <Typography variant="title" color="inherit">
          created project
        </Typography>
        <Paper style={{ width: '60%', padding: '15px', marginTop: '15px' }}>
          <form noValidate autoComplete="off" style={{ marginBottom: '15px' }}>
            <TextField
              fullWidth
              required
              id="description"
              label="project name"
              value={this.state.description}
              onChange={this.getInputHandler('description')}
              margin="normal"
            />
            <TextField
              fullWidth
              required
              id="minInvest"
              label="minimum investment amount"
              value={this.state.minInvest}
              onChange={this.getInputHandler('minInvest')}
              margin="normal"
              InputProps={{ endAdornment: 'ETH' }}
            />
            <TextField
              fullWidth
              required
              id="maxInvest"
              label="maximum investment amount"
              value={this.state.maxInvest}
              onChange={this.getInputHandler('maxInvest')}
              margin="normal"
              InputProps={{ endAdornment: 'ETH' }}
            />
            <TextField
              fullWidth
              required
              id="goal"
              label="project fundraising cap"
              value={this.state.goal}
              onChange={this.getInputHandler('goal')}
              margin="normal"
              InputProps={{ endAdornment: 'ETH' }}
            />
          </form>
          <Button variant="raised" size="large" color="primary" onClick={this.onSubmit}>
            {this.state.loading ? <CircularProgress color="secondary" size={24} /> : 'Create Project'}
          </Button>
          {!!this.state.errmsg && (
            <Typography component="p" style={{ color: 'red' }}>
              {this.state.errmsg}
            </Typography>
          )}
        </Paper>
      </Layout>
    );
  }
}

export default withRoot(ProjectCreate);
