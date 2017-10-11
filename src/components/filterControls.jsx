'use strict';

import _ from 'lodash';
import React from 'react';
import { Checkbox, CheckboxGroup } from 'react-checkbox-group';
import filterStore from './filterStore';
import filterActions from './filterActions';
import trafficStore from './trafficStore';
import Stepper from './stepper';

import './controls.css';

class FilterControls extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      filters: filterStore.getFilters(),
      states: filterStore.getStates(),
      classes: [],
      initialized: false
    };
  }

  componentDidMount () {
    filterStore.addChangeListener(this.onChangeFilters.bind(this));
    trafficStore.addChangeListener(this.onChangeTraffic.bind(this));
  }

  componentWillUnmount () {
    filterStore.removeChangeListener(this.onChangeFilters.bind(this));
    trafficStore.removeChangeListener(this.onChangeTraffic.bind(this));
  }

  onChangeFilters () {
    this.setState({
      filters: filterStore.getFilters()
    });
  }

  onChangeTraffic () {
    const traffic = trafficStore.getTraffic();
    if (!traffic.nodes) {
      return;
    }

    const listup = (nodes, self) => {
      if (nodes && nodes.length) {
        if (nodes.length <= 0) {
          return [];
        }

        return _.flatten(_.map(nodes, node => (node.class ? node.class : '')).concat(_.map(nodes, node => self(node.nodes, self))));
      }
      return [];
    };

    let classes = listup(traffic.nodes, listup);
    classes = _.sortBy(_.uniq(classes));

    this.setState({ classes: classes });
    if (!this.state.initialized && classes.length > 0) {
      setTimeout(() => {
        filterActions.updateDefaultFilters({ clas: { value: classes } });
        filterActions.resetFilters();
      }, 0);
      this.setState({ initialized: true });
    }
  }

  rpsChanged (step) {
    filterActions.updateFilter({ rps: this.state.states.rps[step].value });
  }

  errorChanged (step) {
    filterActions.updateFilter({ error: this.state.states.error[step].value });
  }

  classChanged (value) {
    filterActions.updateFilter({ clas: value });
  }

  noticeChanged (value) {
    filterActions.updateFilter({ notice: value });
  }

  resetFilters () {
    filterActions.resetFilters();
  }

  render () {
    const defaultFilters = filterStore.isDefault();
    const notices = filterStore.getDefaultFilters().notice.value;

    return (
        <div className="vizceral-controls-panel">
          <div className="vizceral-control">
            <span>RPS</span>
            <Stepper steps={this.state.states.rps} selectedStep={filterStore.getStepFromValue('rps')} changeCallback={(step) => { this.rpsChanged(step); }} />
            <span>Error(%)</span>
            <Stepper steps={this.state.states.error} selectedStep={filterStore.getStepFromValue('error')} changeCallback={(step) => { this.errorChanged(step); }} />
            <span>Notices</span>
            <CheckboxGroup name="notice-filter" value={this.state.filters.notice.value} onChange={(value) => {this.noticeChanged(value); }}>
              { _.map(notices, (notice) => {
                return (
                  <div key={notice}><label><Checkbox value={notice} disabled={filterStore.isLastNotice(notice)} />{notice}</label></div>
                );
              }) }
            </CheckboxGroup>
            <span>Classes</span>
            <CheckboxGroup name="class-filter" value={this.state.filters.clas.value} onChange={(value) => { this.classChanged(value); }}>
            {
              this.state.classes.map(clas => (<div key={clas}><label><Checkbox value={clas} disabled={filterStore.isLastClass(clas)} />{clas}</label></div>))
            }
            </CheckboxGroup>
          </div>
          <div className="vizceral-control">
            <button type="button" className="btn btn-default btn-block btn-xs" disabled={defaultFilters} onClick={this.resetFilters.bind(this)}>Reset Filters</button>
          </div>
        </div>
    );
  }
}

FilterControls.propTypes = {
};

export default FilterControls;