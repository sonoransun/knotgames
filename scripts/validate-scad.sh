#!/usr/bin/env bash
# Validate all OpenSCAD puzzle models by compiling each part.
# Uses openscad -o /dev/null (syntax + assertions, no full CGAL render).
set -uo pipefail

SCAD_DIR="$(cd "$(dirname "$0")/../scad" && pwd)"

if ! command -v openscad &>/dev/null; then
    echo "ERROR: openscad not found. Install with: sudo apt-get install -y openscad"
    exit 1
fi

FAIL=0
WARN=0
PASS=0

# puzzle_file : space-separated part values
declare -A PARTS
PARTS[puzzle_01/gatekeeper.scad]="assembly u_bar ring"
PARTS[puzzle_02/shepherds_yoke.scad]="assembly paddle"
PARTS[puzzle_03/prisoners_ring.scad]="assembly frame ring"
PARTS[puzzle_04/mobius_snare.scad]="assembly band ring rivet"
PARTS[puzzle_05/trinity_lock.scad]="assembly oval_red oval_blue oval_yellow display_stand"
PARTS[puzzle_06/devils_pitchfork.scad]="assembly fork ring"
PARTS[puzzle_07/ferrymans_knot.scad]="assembly post finial base ring"
PARTS[puzzle_08/ouroboros_chain.scad]="assembly base post shuttle_bar"
PARTS[puzzle_09/genus_trap.scad]="assembly block_left block_right tunnel_a_liner tunnel_b_liner ring ball_stop"
PARTS[puzzle_10/hopf_paradox.scad]="assembly equatorial polar_half ring ring_test_50 ring_test_60 handle ball"
PARTS[puzzle_11/mirror_gate.scad]="assembly trefoil_left trefoil_right base"
PARTS[puzzle_12/braid_cage.scad]="assembly base post ring"
PARTS[puzzle_13/torus_winder.scad]="assembly torus ring ball_stop"
PARTS[puzzle_14/tricolor_lock.scad]="assembly trefoil_frame ring base"
PARTS[puzzle_15/seifert_sail.scad]="assembly trefoil_frame base"
PARTS[puzzle_16/crossing_number.scad]="assembly fig8_frame pin ring base"
PARTS[puzzle_17/satellite_trap.scad]="assembly torus_shell_half ring_inner ring_outer ball_stop"

# Sort keys for consistent output
SORTED_KEYS=$(echo "${!PARTS[@]}" | tr ' ' '\n' | sort)

echo "Validating OpenSCAD models..."
echo ""

for file in $SORTED_KEYS; do
    scad_path="$SCAD_DIR/$file"
    if [ ! -f "$scad_path" ]; then
        echo "  SKIP  $file (not found)"
        continue
    fi

    for part in ${PARTS[$file]}; do
        printf "  %-50s " "$file [part=$part]"
        OUTPUT=$(openscad -o /dev/null --export-format stl \
            -D "part=\"$part\"" \
            "$scad_path" 2>&1) && RC=$? || RC=$?

        if [ $RC -ne 0 ]; then
            echo "FAIL"
            echo "$OUTPUT" | grep -E "(ERROR|TRACE|assert)" | head -5
            FAIL=$((FAIL + 1))
        else
            MARGINAL=$(echo "$OUTPUT" | grep -c "MARGINAL" || true)
            TOO_LONG=$(echo "$OUTPUT" | grep -c "TOO LONG" || true)
            if [ "$TOO_LONG" -gt 0 ]; then
                echo "WARN (bridge too long)"
                WARN=$((WARN + 1))
            elif [ "$MARGINAL" -gt 0 ]; then
                echo "WARN (marginal bridge)"
                WARN=$((WARN + 1))
            else
                echo "OK"
            fi
            PASS=$((PASS + 1))
        fi
    done
done

echo ""
echo "Results: $PASS passed, $FAIL failed, $WARN warnings"
[ $FAIL -eq 0 ] && exit 0 || exit 1
