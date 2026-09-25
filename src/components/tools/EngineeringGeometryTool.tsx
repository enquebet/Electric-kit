import React, { useState, useMemo } from 'react';
import {
  solveTriangle,
  calculateCircle,
  calculateRegularPolygon,
  calculateEngineeringVolume,
  Shape3D,
} from '../../engines/math/geometry';
import {
  cartesianToCylindrical,
  cartesianToSpherical,
} from '../../engines/math/vectors';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { Box, Circle, Triangle, Globe } from 'lucide-react';

export function EngineeringGeometryTool() {
  const [activeTab, setActiveTab] = useState<'triangle' | 'polygon_circle' | 'solids' | 'coordinates'>('triangle');

  // 1. Triangle State
  const [triMode, setTriMode] = useState<'SSS' | 'SAS' | 'ASA'>('SAS');
  const [sideA, setSideA] = useState<number>(3);
  const [sideB, setSideB] = useState<number>(4);
  const [sideC, setSideC] = useState<number>(5);
  const [angleCdeg, setAngleCdeg] = useState<number>(90);
  const [angleAdeg, setAngleAdeg] = useState<number>(36.87);
  const [angleBdeg, setAngleBdeg] = useState<number>(53.13);

  // 2. Circle & Polygon State
  const [geomType, setGeomType] = useState<'circle' | 'polygon'>('circle');
  const [circleRadius, setCircleRadius] = useState<number>(10);
  const [polySides, setPolySides] = useState<number>(6); // Hexagon
  const [polySideLen, setPolySideLen] = useState<number>(5);

  // 3. 3D Solids State
  const [solidType, setSolidType] = useState<Shape3D>('cylinder');
  const [dim1, setDim1] = useState<number>(5);  // radius / length
  const [dim2, setDim2] = useState<number>(10); // height / width
  const [dim3, setDim3] = useState<number>(8);  // depth

  // 4. Coordinates State
  const [coordX, setCoordX] = useState<number>(3);
  const [coordY, setCoordY] = useState<number>(4);
  const [coordZ, setCoordZ] = useState<number>(5);

  // Triangle Calculations
  const triangleResult = useMemo(() => {
    try {
      if (triMode === 'SSS') return solveTriangle({ sideA, sideB, sideC });
      if (triMode === 'SAS') return solveTriangle({ sideA, sideB, angleCDeg: angleCdeg });
      return solveTriangle({ angleADeg: angleAdeg, sideC, angleBDeg: angleBdeg });
    } catch {
      return null;
    }
  }, [triMode, sideA, sideB, sideC, angleCdeg, angleAdeg, angleBdeg]);

  // Circle / Polygon Calculations
  const circleResult = useMemo(() => calculateCircle(circleRadius), [circleRadius]);
  const polyResult = useMemo(
    () => calculateRegularPolygon(polySides, polySideLen),
    [polySides, polySideLen]
  );

  // 3D Solids Calculations
  const solidResult = useMemo(() => {
    try {
      if (solidType === 'cylinder') return calculateEngineeringVolume('cylinder', { radius: dim1, height: dim2 });
      if (solidType === 'sphere') return calculateEngineeringVolume('sphere', { radius: dim1 });
      if (solidType === 'rectangular_prism') {
        return calculateEngineeringVolume('rectangular_prism', { length: dim1, width: dim2, height: dim3 });
      }
      return calculateEngineeringVolume('cone', { radius: dim1, height: dim2 });
    } catch {
      return null;
    }
  }, [solidType, dim1, dim2, dim3]);

  // Coordinate Transformations
  const cylFromCart = useMemo(() => cartesianToCylindrical(coordX, coordY, coordZ), [coordX, coordY, coordZ]);
  const sphFromCart = useMemo(() => cartesianToSpherical(coordX, coordY, coordZ), [coordX, coordY, coordZ]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('triangle')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'triangle'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Triangle className="w-3.5 h-3.5" />
          Triangle Solver (Sines / Cosines)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('polygon_circle')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'polygon_circle'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Circle className="w-3.5 h-3.5" />
          Circles & Regular Polygons
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('solids')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'solids'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          3D Volumes & Enclosures
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('coordinates')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'coordinates'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          3D Coordinate Transforms
        </button>
      </div>

      {/* 1. Triangle Tab */}
      {activeTab === 'triangle' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Given Triangle Elements</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['SAS', 'SSS', 'ASA'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTriMode(m)}
                  className={`py-1.5 text-xs font-mono rounded border transition-all ${
                    triMode === m
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {triMode === 'SSS' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400">Side a</label>
                    <input
                      type="number"
                      step="any"
                      value={sideA}
                      onChange={(e) => setSideA(parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400">Side b</label>
                    <input
                      type="number"
                      step="any"
                      value={sideB}
                      onChange={(e) => setSideB(parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400">Side c</label>
                    <input
                      type="number"
                      step="any"
                      value={sideC}
                      onChange={(e) => setSideC(parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {triMode === 'SAS' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400">Side a</label>
                    <input
                      type="number"
                      step="any"
                      value={sideA}
                      onChange={(e) => setSideA(parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400">Side b</label>
                    <input
                      type="number"
                      step="any"
                      value={sideB}
                      onChange={(e) => setSideB(parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400">Included Angle C (Degrees)</label>
                  <input
                    type="number"
                    step="any"
                    value={angleCdeg}
                    onChange={(e) => setAngleCdeg(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                  />
                </div>
              </div>
            )}

            {triMode === 'ASA' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400">Angle A (Degrees)</label>
                    <input
                      type="number"
                      step="any"
                      value={angleAdeg}
                      onChange={(e) => setAngleAdeg(parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400">Angle B (Degrees)</label>
                    <input
                      type="number"
                      step="any"
                      value={angleBdeg}
                      onChange={(e) => setAngleBdeg(parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400">Included Side c</label>
                  <input
                    type="number"
                    step="any"
                    value={sideC}
                    onChange={(e) => setSideC(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-4">
            {triangleResult ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ResultCard
                    label="Triangle Area (Heron)"
                    value={triangleResult.area.toFixed(4)}
                    subtext={`Perimeter P = ${triangleResult.perimeter.toFixed(3)} | Semi-p s = ${triangleResult.semiPerimeter.toFixed(3)}`}
                    classification="THEORETICAL"
                  />
                  <ResultCard
                    label="Angles (A, B, C)"
                    value={`${triangleResult.angleADeg.toFixed(1)}°, ${triangleResult.angleBDeg.toFixed(1)}°, ${triangleResult.angleCDeg.toFixed(1)}°`}
                    subtext={`Sides: a=${triangleResult.sideA.toFixed(2)}, b=${triangleResult.sideB.toFixed(2)}, c=${triangleResult.sideC.toFixed(2)}`}
                    classification="THEORETICAL"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ResultCard
                    label="Inradius (r)"
                    value={triangleResult.inradius.toFixed(4)}
                    subtext="r = Area / s"
                    classification="THEORETICAL"
                  />
                  <ResultCard
                    label="Circumradius (R)"
                    value={triangleResult.circumradius.toFixed(4)}
                    subtext="R = (a·b·c) / (4·Area)"
                    classification="THEORETICAL"
                  />
                </div>
                <CalculationStepViewer steps={triangleResult.steps} />
              </>
            ) : (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
                Please enter geometrically valid dimensions satisfying the triangle inequality.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Circles & Polygons Tab */}
      {activeTab === 'polygon_circle' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGeomType('circle')}
                className={`py-1.5 text-xs font-mono rounded border transition-all ${
                  geomType === 'circle'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Circle
              </button>
              <button
                type="button"
                onClick={() => setGeomType('polygon')}
                className={`py-1.5 text-xs font-mono rounded border transition-all ${
                  geomType === 'polygon'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Regular Polygon
              </button>
            </div>

            {geomType === 'circle' ? (
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Radius r</label>
                <input
                  type="number"
                  step="any"
                  value={circleRadius}
                  onChange={(e) => setCircleRadius(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Number of Sides (n)</label>
                  <input
                    type="number"
                    min="3"
                    max="64"
                    value={polySides}
                    onChange={(e) => setPolySides(parseInt(e.target.value, 10) || 3)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Side Length (s)</label>
                  <input
                    type="number"
                    step="any"
                    value={polySideLen}
                    onChange={(e) => setPolySideLen(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-4">
            {geomType === 'circle' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ResultCard
                    label="Circle Area"
                    value={circleResult.area.toFixed(4)}
                    subtext="A = π · r²"
                    classification="THEORETICAL"
                  />
                  <ResultCard
                    label="Circumference"
                    value={circleResult.circumference.toFixed(4)}
                    subtext={`C = 2π · r | Diameter d = ${circleResult.diameter.toFixed(2)}`}
                    classification="THEORETICAL"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ResultCard
                    label="Polygon Area"
                    value={polyResult.area.toFixed(4)}
                    subtext={`A = ½ · P · a | Apothem: ${polyResult.apothemR.toFixed(3)}`}
                    classification="THEORETICAL"
                  />
                  <ResultCard
                    label="Perimeter"
                    value={polyResult.perimeter.toFixed(4)}
                    subtext={`Interior Angle: ${polyResult.interiorAngleDeg.toFixed(2)}°`}
                    classification="THEORETICAL"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 3. 3D Solids Tab */}
      {activeTab === 'solids' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Solid Shape</h3>
            <select
              value={solidType}
              onChange={(e) => setSolidType(e.target.value as Shape3D)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
            >
              <option value="cylinder">Cylinder (r, h)</option>
              <option value="sphere">Sphere (r)</option>
              <option value="rectangular_prism">Rectangular Enclosure (l, w, h)</option>
              <option value="cone">Right Circular Cone (r, h)</option>
            </select>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  {solidType === 'rectangular_prism' ? 'Length (l)' : 'Radius (r)'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={dim1}
                  onChange={(e) => setDim1(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                />
              </div>

              {solidType !== 'sphere' && (
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    {solidType === 'rectangular_prism' ? 'Width (w)' : 'Height (h)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={dim2}
                    onChange={(e) => setDim2(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                  />
                </div>
              )}

              {solidType === 'rectangular_prism' && (
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Height (h)</label>
                  <input
                    type="number"
                    step="any"
                    value={dim3}
                    onChange={(e) => setDim3(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {solidResult && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ResultCard
                    label="Volume (V)"
                    value={solidResult.volume.toFixed(4)}
                    subtext="Enclosed cubic capacity"
                    classification="THEORETICAL"
                  />
                  <ResultCard
                    label="Total Surface Area (A)"
                    value={solidResult.surfaceArea.toFixed(4)}
                    subtext="Enclosing boundary area"
                    classification="THEORETICAL"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 4. Coordinate Transforms Tab */}
      {activeTab === 'coordinates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Cartesian Coordinates (x, y, z)</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400">x</label>
                <input
                  type="number"
                  step="any"
                  value={coordX}
                  onChange={(e) => setCoordX(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400">y</label>
                <input
                  type="number"
                  step="any"
                  value={coordY}
                  onChange={(e) => setCoordY(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400">z</label>
                <input
                  type="number"
                  step="any"
                  value={coordZ}
                  onChange={(e) => setCoordZ(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <ResultCard
              label="Cylindrical Coordinates (r, θ, z)"
              value={`(${cylFromCart.r.toFixed(3)}, ${cylFromCart.thetaDeg.toFixed(1)}°, ${cylFromCart.z.toFixed(2)})`}
              subtext={`θ = ${cylFromCart.thetaRad.toFixed(4)} rad | r = √(x² + y²)`}
              classification="THEORETICAL"
            />
            <ResultCard
              label="Spherical Coordinates (ρ, θ, φ)"
              value={`(${sphFromCart.rho.toFixed(3)}, ${sphFromCart.thetaDeg.toFixed(1)}°, ${sphFromCart.phiDeg.toFixed(1)}°)`}
              subtext={`Radial distance ρ = ${sphFromCart.rho.toFixed(3)} | Azimuth θ, Polar inclination φ`}
              classification="THEORETICAL"
            />
          </div>
        </div>
      )}
    </div>
  );
}
