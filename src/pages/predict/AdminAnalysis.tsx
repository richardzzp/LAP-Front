import React, { Component, Suspense } from 'react';
import { connect } from 'dva';
import { Col, Row } from 'antd';
import { RangePickerValue } from 'antd/es/date-picker/interface';
import { Dispatch } from 'redux';
import { GridContent } from '@ant-design/pro-layout';
import { getTimeDistance } from './utils/utils';
import PageLoading from './components/PageLoading';
import { IAnalysisData } from './data.d';
import getFakeChartData from './mock-data';

const IntroduceRow = React.lazy(() => import('./components/IntroduceRow'));
const SalesCard = React.lazy(() => import('./components/SalesCard'));
const TopSearch = React.lazy(() => import('./components/TopSearch'));
const ProportionSales = React.lazy(() => import('./components/ProportionSales'));

interface analysisProps {
  analysis?: IAnalysisData;
  dispatch?: Dispatch<any>;
  loading?: boolean;
}

interface analysisState {
  salesType: 'all' | 'online' | 'stores';
  currentTabKey: string;
  rangePickerValue: RangePickerValue;
}

@connect(
  ({
    analysis,
    loading,
  }: {
    analysis: any;
    loading: {
      effects: { [key: string]: boolean };
    };
  }) => ({
    analysis,
    loading: loading.effects['analysis/fetch'],
  }),
)
class AdminAnalysis extends Component<analysisProps, analysisState> {
  state: analysisState = {
    salesType: 'all',
    currentTabKey: '',
    rangePickerValue: getTimeDistance('year'),
  };
  reqRef!: number;
  timeoutId!: number;
  tenant = localStorage.getItem('tenants-amdin');

  componentDidMount() {
    const { dispatch } = this.props;
    this.reqRef = requestAnimationFrame(() => {
      dispatch({
        type: 'analysis/fetch',
      });
    });
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'analysis/clear',
    });
    cancelAnimationFrame(this.reqRef);
    clearTimeout(this.timeoutId);
  }

  render() {
    const { loading } = this.props;
    const {
      visitData,
    } = getFakeChartData;
    console.log(this.props)
    return (
      <GridContent>
        <React.Fragment>
          <Suspense fallback={null}>
            <SalesCard loading={loading} />
          </Suspense>
        </React.Fragment>
      </GridContent>
    );
  }
}

export default AdminAnalysis;
