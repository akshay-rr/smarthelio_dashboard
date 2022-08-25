import React, { useEffect, useRef, useState } from 'react';
import { DynamoDBClient, DynamoDBClientConfig, ListTablesCommand, QueryCommand, ScanCommand, ScanCommandInput, ScanCommandOutput } from '@aws-sdk/client-dynamodb';
import './App.css';
import { Credentials } from 'aws-sdk';
import { QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { String } from 'aws-sdk/clients/ivschat';
import { getSensors, getSensorData } from './services/FetchDataService';
import { Graph } from './services/ChartService';


const SearchbarDropdown = (props: { options: (string | undefined)[], onInputChange: any, disabled: boolean, setValue: any}) => {
    const { options, onInputChange, disabled, setValue } = props;
    const ulRef: { current: any | null } = useRef<HTMLUListElement>();
    const inputRef: { current: any | null } = useRef<HTMLInputElement>();
    useEffect(() => {
        inputRef.current.addEventListener('click', (event: any) => {
            event.stopPropagation();
            if(ulRef != undefined && ulRef.current != undefined) {
                console.log(ulRef);
                ulRef.current.style.display = 'flex';
            }
            onInputChange(event);
        });

        if(ulRef != undefined && ulRef.current != undefined) {
            document.addEventListener('click', (event) => {
                ulRef.current.style.display = 'none';
            });
        }
    }, []);
    return (
      <div className="search-bar-dropdown">
        <input
          id="search-bar"
          type="text"
          className="form-control"
          placeholder="Search"
          ref={inputRef}
          onKeyUp={onInputChange}
          disabled={disabled}
        />
        {
            options.length > 0 ?
            <ul id="results" className="list-group" ref={ulRef}>
                {options.map((option, index) => {
                    return (
                    <button
                        type="button"
                        key={index}
                        onClick={(e) => {
                        inputRef.current.value = option;
                        setValue(option);
                        }}
                        className="list-group-item list-group-item-action"
                    >
                        {option}
                    </button>
                    );
                })}
            </ul> :
            <div id="results"> No Sensor Ids Found </div>
        }
      </div>
    );
};


function App() {

    
    
    const [loading, setLoading] = useState(true);
    
    const [defaultOptions, setDefaultOptions] = useState([] as (string | undefined)[]);
    const [options, setOptions] = useState([] as (string | undefined)[]);
    const [selectedSensorId, setSelectedSensorId] = useState('');
    
    const [toDate, setToDate] = useState('');
    const [fromDate, setFromDate] = useState('');

    const [readings, setReadings] = useState([] as any);

    const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedSensorId(event.currentTarget.value);
        setOptions(
            event.currentTarget.value != undefined &&  event.currentTarget.value != null?
            defaultOptions.filter((option) => option?.includes(event.currentTarget.value)) :
            defaultOptions
        );
    };

    const getReadings = () => {
        setLoading(true);
        getSensorData(selectedSensorId, fromDate, toDate).then((results) => {
            setReadings(results);
        }).catch((e) => {
            console.log(e);
        }).finally(() => {
            setLoading(false);
        });
    }

    useEffect(() => {
        getSensors().then((result: (string | undefined)[]) => {
            setDefaultOptions(result);
            setOptions(result);
            setLoading(false);
        }).catch((e) => {
            console.log(e);
        });
    }, []);
    
    return (
        <div className="App">
            <header className="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0 shadow">
                <a className="navbar-brand col-md-3 col-lg-2 me-0 px-3 fs-6" href="#">Smart Helio</a>
                <button className="navbar-toggler position-absolute d-md-none collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#sidebarMenu" aria-controls="sidebarMenu" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
            </header>

            <div className="container-fluid">
                <div className="row">
                    <nav id="sidebarMenu" className="col-md-3 col-lg-3 d-md-block bg-light sidebar collapse">
                        <div className="position-sticky pt-3 sidebar-sticky">
                            
                            <div className="form-container">
                                <SearchbarDropdown options={options} onInputChange={onInputChange} disabled={loading} setValue={setSelectedSensorId} />
                                <div className="date-params input-group input-group-sm mb-3">
                                    <span className="input-group-text" id="inputGroup-sizing-sm">From</span>
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        aria-label="Sizing example input" 
                                        aria-describedby="inputGroup-sizing-sm"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}/>
                                </div>

                                <div className="date-params input-group input-group-sm mb-3">
                                    <span className="input-group-text" id="inputGroup-sizing-sm">To</span>
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        aria-label="Sizing example input" 
                                        aria-describedby="inputGroup-sizing-sm"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}/>
                                </div>

                                <button 
                                    id='submit' 
                                    className='btn btn-sm btn-dark'
                                    onClick={getReadings}>Submit</button>
                                {
                                    (!defaultOptions.includes(selectedSensorId)) &&
                                    <div>Enter Valid Sensor ID</div>
                                }

                            </div>
                        </div>
                    </nav>

                    <main className="col-md-9 ms-sm-auto col-lg-9 px-md-4">
                        {selectedSensorId}
                        <br/>
                        <Graph 
                            x={readings.map((entry: { timestamp: number }) => entry.timestamp)}
                            y={readings.map((entry: { current: number }) => entry.current)}
                            label={'Current (mA)'}/>
                        <Graph 
                            x={readings.map((entry: { timestamp: number }) => entry.timestamp)}
                            y={readings.map((entry: { voltage: number }) => entry.voltage)}
                            label={'Voltage (V)'}/>
                        <Graph 
                            x={readings.map((entry: { timestamp: number }) => entry.timestamp)}
                            y={readings.map((entry: { power: number }) => entry.power)}
                            label={'Power (mW)'}/>
                    </main>
                </div>
            </div>

            <script src="../assets/dist/js/bootstrap.bundle.min.js"></script>
            <script 
                src="https://cdn.jsdelivr.net/npm/feather-icons@4.28.0/dist/feather.min.js" 
                integrity="sha384-uO3SXW5IuS1ZpFPKugNNWqTZRRglnUJK6UAZ/gxOX80nxEkN9NcGZTftn6RzhGWE" 
                crossOrigin="anonymous"></script>
            <script 
                src="https://cdn.jsdelivr.net/npm/chart.js@2.9.4/dist/Chart.min.js" 
                integrity="sha384-zNy6FEbO50N+Cg5wap8IKA4M/ZnLJgzc6w2NqACZaK0u0FXfOWRRJOnQtpZun8ha" 
                crossOrigin="anonymous"></script>
            <script src="dashboard.js"></script>

        </div>
    );
}

export default App;
