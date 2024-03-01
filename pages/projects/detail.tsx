import React from 'react';
import {
  Grid,
  Button,
  Typography,
  LinearProgress,
  CircularProgress,
  Paper,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@material-ui/core';

import { Link } from '../../routes';
import web3 from '../../libs/web3';
import Project from '../../libs/project';
import ProjectList from '../../libs/projectList';
import withRoot from '../../libs/withRoot';
import Layout from '../../components/home-comp/Layout';
import InfoBlock from '../../components/common/InfoBlock';

class ProjectDetail extends React.Component {
  static async getInitialProps({ query }) {
    const contract = Project(query.address);

    const summary = await contract.methods.getSummary().call();
    const [description, minInvest, maxInvest, goal, balance, investorCount, paymentCount, owner] = Object.values(
      summary
    );

    const tasks = [];
    for (let i = 0; i < paymentCount; i++) {
      tasks.push(contract.methods.payments(i).call());
    }
    const payments = await Promise.all(tasks);

    const project = {
      address: query.address,
      description,
      minInvest,
      maxInvest,
      goal,
      balance,
      investorCount,
      paymentCount,
      owner,
      payments,
    };

    console.log(project);

    return { project };
  }

  constructor(props) {
    super(props);

    this.state = {
      amount: 0,
      errmsg: '',
      loading: false,
      isApproving: false,
      isPaying: false,
    };

    this.onSubmit = this.contributeProject.bind(this);
  }

  getInputHandler(key) {
    return e => {
      console.log(e.target.value);
      this.setState({ [key]: e.target.value });
    };
  }

  async contributeProject() {
    const { amount } = this.state;
    const { minInvest, maxInvest } = this.props.project;
    const minInvestInEther = web3.utils.fromWei(minInvest, 'ether');
    const maxInvestInEther = web3.utils.fromWei(maxInvest, 'ether');

    console.log({ amount, minInvestInEther, maxInvestInEther });

    // 字段合规检查
    if (amount <= 0) {
      return this.setState({ errmsg: 'Investment amount must be greater than 0' });
    }
    if (amount < minInvestInEther) {
      return this.setState({ errmsg: 'The investment amount must be greater than the minimum investment amount' });
    }
    if (amount > maxInvestInEther) {
      return this.setState({ errmsg: 'The investment amount must be less than the maximum investment amount' });
    }

    try {
      this.setState({ loading: true, errmsg: '' });

      // Getting an account
      const accounts = await web3.eth.getAccounts();
      const owner = accounts[0];

      // Initiation of transfers
      const contract = Project(this.props.project.address);
      const result = await contract.methods
        .contribute()
        .send({ from: owner, value: web3.utils.toWei(amount, 'ether'), gas: '5000000' });

      this.setState({ errmsg: '投资成功', amount: 0 });
      console.log(result);

      setTimeout(() => {
        location.reload();
      }, 1000);
    } catch (err) {
      console.error(err);
      this.setState({ errmsg: err.message || err.toString });
    } finally {
      this.setState({ loading: false });
    }
  }

  async approvePayment(i) {
    try {
      this.setState({ isApproving: i });

      const accounts = await web3.eth.getAccounts();
      const sender = accounts[0];

      const contract = Project(this.props.project.address);
      const isInvestor = await contract.methods.investors(sender).call();
      if (!isInvestor) {
        return window.alert('Only investors are entitled to vote.');
      }

      const result = await contract.methods.approvePayment(i).send({ from: sender, gas: '5000000' });

      window.alert('The vote was successful.');

      setTimeout(() => {
        location.reload();
      }, 1000);
    } catch (err) {
      console.error(err);
      window.alert(err.message || err.toString());
    } finally {
      this.setState({ isApproving: false });
    }
  }

  async doPayment(i) {
    try {
      this.setState({ isPaying: i });

      const accounts = await web3.eth.getAccounts();
      const sender = accounts[0];

      // Checking accounts
      if (sender !== this.props.project.owner) {
        return window.alert('Only administrators can create fund expenditure requests');
      }

      const contract = Project(this.props.project.address);
      const result = await contract.methods.doPayment(i).send({ from: sender, gas: '5000000' });

      window.alert('Successful transfer of funds');

      setTimeout(() => {
        location.reload();
      }, 1000);
    } catch (err) {
      console.error(err);
      window.alert(err.message || err.toString());
    } finally {
      this.setState({ isPaying: false });
    }
  }

  render() {
    const { project } = this.props;

    return (
      <Layout>
        <Typography variant="title" color="inherit" style={{ margin: '15px 0' }}>
          Project Details
        </Typography>
        {this.renderBasicInfo(project)}
        <Typography variant="title" color="inherit" style={{ margin: '30px 0 15px' }}>
          Requests for expenditure of funds
        </Typography>
        {this.renderPayments(project)}
      </Layout>
    );
  }

  renderBasicInfo(project) {
    const progress = project.balance / project.goal * 100;

    return (
      <Paper style={{ padding: '15px' }}>
        <Typography gutterBottom variant="headline" component="h2">
          {project.description}
        </Typography>
        <LinearProgress style={{ margin: '10px 0' }} color="primary" variant="determinate" value={progress} />
        <Grid container spacing={16}>
          <InfoBlock title={`${web3.utils.fromWei(project.goal, 'ether')} ETH`} description="fundraising cap" />
          <InfoBlock title={`${web3.utils.fromWei(project.minInvest, 'ether')} ETH`} description="Minimum Investment Amount" />
          <InfoBlock title={`${web3.utils.fromWei(project.maxInvest, 'ether')} ETH`} description="Maximum Investment Amount" />
          <InfoBlock title={`${project.investorCount}人`} description="Number of participants" />
          <InfoBlock title={`${web3.utils.fromWei(project.balance, 'ether')} ETH`} description="amount of funds raised" />
        </Grid>
        <Grid container spacing={16}>
          <Grid item md={12}>
            <TextField
              required
              id="amount"
              label="investment amount"
              style={{ marginRight: '15px' }}
              value={this.state.amount}
              onChange={this.getInputHandler('amount')}
              margin="normal"
              InputProps={{ endAdornment: 'ETH' }}
            />
            <Button size="small" variant="raised" color="primary" onClick={this.onSubmit}>
              {this.state.loading ? <CircularProgress color="secondary" size={24} /> : 'Invest Now'}
            </Button>
            {!!this.state.errmsg && (
              <Typography component="p" style={{ color: 'red' }}>
                {this.state.errmsg}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>
    );
  }

  renderPayments(project) {
    if (project.payments.length === 0) {
      return (
        <Paper style={{ padding: '15px' }}>
          <p>还没有数据</p>
          <Link route={`/projects/${project.address}/payments/create`}>
            <Button variant="raised" color="primary">
              创建资金支出请求
            </Button>
          </Link>
        </Paper>
      )
    }

    return (
      <Paper style={{ padding: '15px' }}>
        <Table style={{ marginBottom: '30px' }}>
          <TableHead>
            <TableRow>
              <TableCell> Reasons for expenditure </TableCell>
              <TableCell numeric> Amount for spent</TableCell>
              <TableCell>Payee</TableCell>
              <TableCell> Completed?</TableCell>
              <TableCell>Voting Status</TableCell>
              <TableCell>Manipulate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {project.payments.map((payment, index) => this.renderPaymentRow(payment, index, project))}
          </TableBody>
        </Table>
        <Link route={`/projects/${project.address}/payments/create`}>
          <Button variant="raised" color="primary">
            Creating requests for expenditure of funds
          </Button>
        </Link>
      </Paper>
    );
  }

  isApproving(i) {
    return typeof this.state.isApproving === 'number' && this.state.isApproving === i;
  }

  isPaying(i) {
    return typeof this.state.isPaying === 'number' && this.state.isPaying === i;
  }

  renderPaymentRow(payment, index, project) {
    const canApprove = !payment.completed;
    const canDoPayment = !payment.completed && payment.voterCount / project.investorCount > 0.5;
    return (
      <TableRow key={index}>
        <TableCell>{payment.description}</TableCell>
        <TableCell numeric>{web3.utils.fromWei(payment.amount, 'ether')} ETH</TableCell>
        <TableCell>{payment.receiver}</TableCell>
        <TableCell>{payment.completed ? 'yes' : 'no'}</TableCell>
        <TableCell>
          {payment.voterCount}/{project.investorCount}
        </TableCell>
        <TableCell>
          {canApprove && (
            <Button size="small" color="primary" onClick={() => this.approvePayment(index)}>
              {this.isApproving(index) ? <CircularProgress color="secondary" size={24} /> : 'vote in favor'}
            </Button>
          )}
          {canDoPayment && (
            <Button size="small" color="primary" onClick={() => this.doPayment(index)}>
              {this.isPaying(index) ? <CircularProgress color="primary" size={24} /> : 'Funds transferred'}
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  }
}

export default withRoot(ProjectDetail);
